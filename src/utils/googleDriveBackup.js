import { App } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'
import { SecureStorage } from '@aparajita/capacitor-secure-storage'
import { HosnoteConfig } from '../plugins/HosnoteConfig'

const STORAGE_PREFIX = 'hosnote_google_'
const TOKEN_KEY = 'tokens'
const PENDING_AUTH_KEY = 'pending_auth'
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file'
const BACKUP_FILE_NAME = 'HOsNote Backup'
const BACKUP_MIME_TYPE = 'application/json'
// HTTPS App Link redirect (https://hosnote.vercel.app/oauth2redirect).
//
// Google now blocks custom-scheme redirects (com.hosnote.app:/oauth2redirect)
// for Android OAuth clients by default, so the request is rejected with
// "Error 400: invalid_request" before Google ever sees the code. An HTTPS
// App Link is the supported alternative: it is registered in the Console's
// "Authorized redirect URIs", verified against public/.well-known/
// assetlinks.json, and delivered to HOsNote via the Android intent-filter in
// AndroidManifest.xml.
const NATIVE_REDIRECT_URI = 'https://hosnote.vercel.app/oauth2redirect'
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'
const DRIVE_API_ROOT = 'https://www.googleapis.com/drive/v3'
const DRIVE_UPLOAD_ROOT = 'https://www.googleapis.com/upload/drive/v3'

let prefixPromise = null

async function storage() {
    if (!prefixPromise) {
        prefixPromise = SecureStorage.setKeyPrefix(STORAGE_PREFIX).catch(() => undefined)
    }
    await prefixPromise
    // Return a plain (non-thenable) wrapper around the SecureStorage plugin
    // proxy. The proxy is itself "thenable" — its JS proxy exposes a `then`
    // getter — so `await storage()` would otherwise invoke
    // Promise.resolve(proxy).then(...), which throws
    // "SecureStorage.then() is not implemented on android" as an uncaught
    // rejection and aborts the OAuth callback. A plain object keeps the
    // storage methods reachable without triggering the thenable trap.
    return {
        get: (key) => SecureStorage.get(key),
        set: (key, value) => SecureStorage.set(key, value),
        remove: (key) => SecureStorage.remove(key),
    }
}

function base64Url(value) {
    let binary = ''
    const bytes = new Uint8Array(value)
    for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index])
    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '')
}

function randomBase64Url(bytes = 32) {
    const values = new Uint8Array(bytes)
    crypto.getRandomValues(values)
    return base64Url(values)
}

const WEB_CLIENT_KEY = 'hosnote_web_drive_key'

function getOrCreateWebDriveKey() {
    if (typeof localStorage === 'undefined') return randomBase64Url(32)
    let key = localStorage.getItem(WEB_CLIENT_KEY)
    if (!key) {
        key = randomBase64Url(32)
        try {
            localStorage.setItem(WEB_CLIENT_KEY, key)
        } catch {}
    }
    return key
}

function clearWebDriveKey() {
    if (typeof localStorage !== 'undefined') {
        try {
            localStorage.removeItem(WEB_CLIENT_KEY)
        } catch {}
    }
}

async function sha256Base64Url(value) {
    if (!globalThis.crypto?.subtle) {
        throw new Error('This device does not support the secure crypto APIs required for Google sign-in.')
    }
    const bytes = new TextEncoder().encode(value)
    const digest = await crypto.subtle.digest('SHA-256', bytes)
    return base64Url(new Uint8Array(digest))
}

function getRedirectUri() {
    if (Capacitor.isNativePlatform()) return NATIVE_REDIRECT_URI
    if (typeof window !== 'undefined' && window.location?.origin) {
        return `${window.location.origin}/oauth2redirect`
    }
    return 'http://localhost/oauth2redirect'
}

/**
 * Returns the Web OAuth client ID that was injected at build time by Gradle's
 * {@code buildConfigField}. The native Android app now uses a *Web*
 * application OAuth client (not the Android client) because Google rejects
 * HTTPS redirect URIs for Android client types with "redirect_uri_mismatch",
 * while custom-scheme redirects for Android clients are blocked by default.
 * A Web client accepts the HTTPS App Link redirect
 * (https://hosnote.vercel.app/oauth2redirect), which Android then delivers
 * back to HOsNote via the autoVerify intent-filter in AndroidManifest.xml.
 *
 * The debug build type gets the debug Web client ID and the release build
 * type gets the release Web client ID — determined by the Android build
 * system, NOT by Vite's PROD/DEV flag.
 *
 * On web/PWA this returns an empty string; the web client ID is read
 * separately from {@code VITE_GOOGLE_WEB_CLIENT_ID}.
 */
async function getGoogleWebClientId() {
    if (!Capacitor.isNativePlatform()) return ''
    try {
        const result = await HosnoteConfig.getGoogleWebClientId()
        return result?.clientId || ''
    } catch {
        return ''
    }
}

/**
 * Returns the Android OAuth client ID baked into the APK at build time.
 *
 * This is the credential used by the native Android authorization flow
 * ({@code com.google.android.gms.auth.api.identity.AuthorizationClient}).
 * It is a public client, so no client secret is ever required.
 */
async function getGoogleClientId() {
    if (!Capacitor.isNativePlatform()) return ''
    try {
        const result = await HosnoteConfig.getGoogleClientId()
        return result?.clientId || ''
    } catch {
        return ''
    }
}

export async function isGoogleDriveConfigured() {
    const isNative = Capacitor.isNativePlatform()
    const clientId = isNative
        ? await getGoogleWebClientId()
        : (import.meta.env?.VITE_GOOGLE_WEB_CLIENT_ID || import.meta.env?.VITE_GOOGLE_CLIENT_ID || '')
    return Boolean(clientId)
}

export async function getGoogleDriveConfig() {
    const isNative = Capacitor.isNativePlatform()
    const clientId = isNative
        ? await getGoogleClientId()
        : (import.meta.env?.VITE_GOOGLE_WEB_CLIENT_ID || import.meta.env?.VITE_GOOGLE_CLIENT_ID || '')
    const redirectUri = import.meta.env?.VITE_GOOGLE_REDIRECT_URI || getRedirectUri()

    if (!clientId) {
        if (import.meta.env?.DEV) {
            throw new Error('Google Drive is not configured. Add VITE_GOOGLE_WEB_CLIENT_ID to your environment.')
        } else {
            throw new Error('Unable to connect to Google Drive. Cloud backup is not configured on this build.')
        }
    }

    return { clientId, redirectUri }
}

export function isGoogleDriveSupported() {
    return true
}

async function getTokens() {
    try {
        const store = await storage()
        const raw = await store.get(TOKEN_KEY)
        if (raw) {
            const tokens = typeof raw === 'string' ? JSON.parse(raw) : raw
            if (tokens && tokens.access_token) return tokens
        }
    } catch {
        // Fallback to localStorage if SecureStorage fails on this device
    }

    try {
        const fallback = typeof localStorage !== 'undefined' ? localStorage.getItem(`${STORAGE_PREFIX}${TOKEN_KEY}`) : null
        if (fallback) {
            const tokens = JSON.parse(fallback)
            return tokens && tokens.access_token ? tokens : null
        }
    } catch {
        // Ignore parse error
    }
    return null
}

async function saveTokens(tokens) {
    try {
        const store = await storage()
        await store.set(TOKEN_KEY, tokens)
    } catch {
        // Fallback
    }
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(`${STORAGE_PREFIX}${TOKEN_KEY}`, JSON.stringify(tokens))
        }
    } catch {}
}

async function clearTokens() {
    try {
        const store = await storage()
        await store.remove(TOKEN_KEY)
    } catch {}
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem(`${STORAGE_PREFIX}${TOKEN_KEY}`)
        }
    } catch {}
}

async function savePendingAuth(pendingAuth) {
    try {
        const store = await storage()
        await store.set(PENDING_AUTH_KEY, pendingAuth)
    } catch {}
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(`${STORAGE_PREFIX}${PENDING_AUTH_KEY}`, JSON.stringify(pendingAuth))
        }
    } catch {}
}

async function getPendingAuth() {
    try {
        const store = await storage()
        const raw = await store.get(PENDING_AUTH_KEY)
        if (raw) {
            return typeof raw === 'string' ? JSON.parse(raw) : raw
        }
    } catch {}

    try {
        const fallback = typeof localStorage !== 'undefined' ? localStorage.getItem(`${STORAGE_PREFIX}${PENDING_AUTH_KEY}`) : null
        if (fallback) {
            return JSON.parse(fallback)
        }
    } catch {}
    return null
}

async function clearPendingAuth() {
    try {
        const store = await storage()
        await store.remove(PENDING_AUTH_KEY)
    } catch {}
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem(`${STORAGE_PREFIX}${PENDING_AUTH_KEY}`)
        }
    } catch {}
}

async function tokenRequest(parameters) {
    let response
    try {
        response = await fetch(TOKEN_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(parameters),
        })
    } catch {
        throw new Error('Unable to connect to Google authentication server. Please check your internet connection and try again.')
    }

    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
        const desc = payload.error_description || payload.error
        if (desc?.includes('invalid_grant') || desc?.includes('expired') || desc?.includes('revoked')) {
            throw new Error('Your Google Drive authorization has expired. Please reconnect.')
        }
        throw new Error(desc || 'Google authentication failed')
    }
    return {
        ...payload,
        expires_at: Date.now() + Number(payload.expires_in || 3600) * 1000,
    }
}

let gisLoadPromise = null
let gisTokenClient = null

export function ensureGisLoaded() {
    if (typeof window === 'undefined') return Promise.reject(new Error('Window is not defined'))
    if (window.google?.accounts?.oauth2) return Promise.resolve(window.google.accounts.oauth2)
    if (gisLoadPromise) return gisLoadPromise

    gisLoadPromise = new Promise((resolve, reject) => {
        const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
        if (existingScript) {
            existingScript.addEventListener('load', () => {
                if (window.google?.accounts?.oauth2) resolve(window.google.accounts.oauth2)
                else reject(new Error('Google Identity Services failed to initialize'))
            })
            existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services')))
            if (window.google?.accounts?.oauth2) resolve(window.google.accounts.oauth2)
            return
        }
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        script.onload = () => {
            if (window.google?.accounts?.oauth2) resolve(window.google.accounts.oauth2)
            else reject(new Error('Google Identity Services failed to initialize'))
        }
        script.onerror = () => reject(new Error('Failed to load Google Identity Services'))
        document.head.appendChild(script)
    })
    return gisLoadPromise
}

function requestGisToken(options = {}) {
    return new Promise((resolve, reject) => {
        ensureGisLoaded().then((oauth2) => {
            const clientId = import.meta.env?.VITE_GOOGLE_WEB_CLIENT_ID || import.meta.env?.VITE_GOOGLE_CLIENT_ID || ''
            if (!clientId) {
                if (import.meta.env?.DEV) {
                    reject(new Error('Google Drive is not configured. Add VITE_GOOGLE_WEB_CLIENT_ID to your environment.'))
                } else {
                    reject(new Error('Unable to connect to Google Drive. Cloud backup is not configured on this build.'))
                }
                return
            }

            if (!gisTokenClient) {
                gisTokenClient = oauth2.initTokenClient({
                    client_id: clientId,
                    scope: DRIVE_SCOPE,
                    callback: () => {},
                })
            }

            gisTokenClient.callback = (response) => {
                if (response.error) {
                    if (response.error === 'access_denied') {
                        reject(new Error('Google Drive connection was cancelled.'))
                    } else {
                        reject(new Error(response.error_description || response.error))
                    }
                } else {
                    resolve(response)
                }
            }

            gisTokenClient.error_callback = (err) => {
                if (err?.type === 'popup_closed') {
                    reject(new Error('Google Drive connection was cancelled.'))
                } else {
                    reject(new Error(err?.message || err?.type || 'Google Identity Services error'))
                }
            }

            gisTokenClient.requestAccessToken(options)
        }).catch(reject)
    })
}

export async function startGoogleDriveAuth() {
    if (!isGoogleDriveSupported()) {
        throw new Error('Google Drive backup is not supported on this device.')
    }

    // Native Android path: use the current officially supported Android
    // authorization API (com.google.android.gms.auth.api.identity
    // .AuthorizationClient) exposed through the HosnoteConfig plugin.
    //
    // This intentionally does NOT use the Web OAuth client + PKCE flow:
    // Play services resolves the account, shows the consent screen, and
    // returns the access token directly. No authorization-code exchange,
    // no token endpoint call, and no client secret are involved — the
    // Android OAuth client baked into the APK is the only credential.
    if (Capacitor.isNativePlatform()) {
        const result = await HosnoteConfig.authorizeGoogleDrive({
            scope: DRIVE_SCOPE,
            offline: true,
        })
        const tokens = buildTokensFromAuthorizationResult(result)
        await saveTokens(tokens)
        return tokens.state || 'native'
    }

    // Web/PWA path: Server-side OAuth 2.0 with durable refresh authorization
    const clientKey = getOrCreateWebDriveKey()

    const startRes = await fetch('/api/auth/google/start', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-hosnote-client-key': clientKey,
        },
    })
    const startData = await startRes.json().catch(() => ({}))
    if (!startRes.ok || !startData.authUrl) {
        throw new Error(startData.error || 'Failed to start Google Drive authorization.')
    }

    const width = 500
    const height = 650
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2
    const popup = window.open(
        startData.authUrl,
        'hosnote_google_auth',
        `width=${width},height=${height},left=${left},top=${top},status=no,menubar=no,toolbar=no`
    )

    if (!popup) {
        throw new Error('Popup window was blocked by your browser. Please allow popups for HOsNote to connect Google Drive.')
    }

    await new Promise((resolve, reject) => {
        let isResolved = false

        const messageHandler = (event) => {
            if (event.origin !== window.location.origin) return
            if (event.data?.type === 'HOSNOTE_GOOGLE_AUTH_SUCCESS') {
                isResolved = true
                window.removeEventListener('message', messageHandler)
                clearInterval(checkClosedInterval)
                resolve()
            } else if (event.data?.type === 'HOSNOTE_GOOGLE_AUTH_ERROR') {
                isResolved = true
                window.removeEventListener('message', messageHandler)
                clearInterval(checkClosedInterval)
                reject(new Error(event.data.error || 'Google Drive authorization failed.'))
            }
        }

        window.addEventListener('message', messageHandler)

        const checkClosedInterval = setInterval(() => {
            if (popup.closed) {
                clearInterval(checkClosedInterval)
                window.removeEventListener('message', messageHandler)
                if (!isResolved) {
                    reject(new Error('Google Drive connection was cancelled.'))
                }
            }
        }, 500)
    })

    const tokenRes = await fetch('/api/drive/token', {
        headers: { 'x-hosnote-client-key': clientKey },
    })
    const tokenData = await tokenRes.json().catch(() => ({}))
    if (!tokenRes.ok || !tokenData.access_token) {
        throw new Error(tokenData.error || 'Failed to retrieve access token from server.')
    }

    const tokens = {
        access_token: tokenData.access_token,
        refresh_token: 'server_managed',
        scope: DRIVE_SCOPE,
        token_type: 'Bearer',
        expires_in: Number(tokenData.expires_in) || 3600,
        expires_at: tokenData.expires_at || (Date.now() + 3600 * 1000),
        state: 'backend',
        email: tokenData.email || null,
    }
    await saveTokens(tokens)
    return tokens
}

/**
 * Converts the {@code authorizeGoogleDrive} plugin payload into the token
 * shape the rest of the module already consumes
 * ({@link getTokens}, {@link getGoogleDriveAccessToken}, refresh logic).
 *
 * The native flow returns the access token directly and, when requested,
 * a refresh token plus the token lifetime. No {@code expires_at} is
 * computed here; {@link getGoogleDriveAccessToken} refreshes via the
 * refresh token when the access token nears expiry.
 */
function buildTokensFromAuthorizationResult(result) {
    // DIAGNOSTIC: log the raw native payload so we can see what Google
    // actually returned (access token, refresh token, expires_in, scopes).
    try {
        console.log('[GoogleDrive] native auth result:', JSON.stringify({
            accessTokenLen: result?.accessToken ? String(result.accessToken).length : 0,
            hasRefreshToken: Boolean(result?.refreshToken),
            expiresInSeconds: result?.expiresInSeconds,
            grantedScopes: Array.isArray(result?.grantedScopes) ? result.grantedScopes.length : result?.grantedScopes,
            hasResolution: result?.hasResolution,
        }))
    } catch {
        // ignore
    }

    const tokens = {
        access_token: result?.accessToken,
        refresh_token: result?.refreshToken || null,
        scope: DRIVE_SCOPE,
        token_type: 'Bearer',
        expires_in: Number(result?.expiresInSeconds) || 3600,
        expires_at: Date.now() + (Number(result?.expiresInSeconds) || 3600) * 1000,
        state: result?.state || 'native',
    }
    if (!tokens.access_token) {
        // Include the raw native payload in the error so the next test
        // report reveals exactly what Google returned (access token,
        // refresh token, expires_in, server auth code, scopes).
        const diag = {
            accessToken: result?.accessToken,
            refreshToken: result?.refreshToken,
            expiresInSeconds: result?.expiresInSeconds,
            grantedScopes: result?.grantedScopes,
            hasResolution: result?.hasResolution,
            raw: result,
        }
        throw new Error('Google Drive authorization did not return an access token. ' + JSON.stringify(diag))
    }
    return tokens
}

export async function completeGoogleDriveAuth(url) {
    // NOTE: no Browser.close() here. The Android flow now opens the device's
    // DEFAULT external browser via HosnoteConfig.openExternalUrl(), so there
    // is no in-app Custom Tabs window to close. Google's redirect back to
    // com.hosnote.app:/oauth2redirect is delivered through the Capacitor
    // appUrlOpen event instead.

    const parsed = new URL(url, typeof window !== 'undefined' ? window.location.href : 'http://localhost')
    const error = parsed.searchParams.get('error')
    if (error) {
        if (error === 'access_denied') {
            throw new Error('Google Drive connection was cancelled.')
        }
        throw new Error(parsed.searchParams.get('error_description') || error)
    }

    const code = parsed.searchParams.get('code')
    const state = parsed.searchParams.get('state')
    if (!code || !state) throw new Error('Google returned an incomplete authorization response')

    const pendingAuth = await getPendingAuth()
    if (!pendingAuth || pendingAuth.state !== state) {
        throw new Error('Google authorization could not be verified. Please try again.')
    }
    if (Date.now() - pendingAuth.createdAt > 10 * 60 * 1000) {
        throw new Error('Google authorization timed out. Please try again.')
    }

    const { clientId, redirectUri } = await getGoogleDriveConfig()
    const tokens = await tokenRequest({
        client_id: clientId,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        code_verifier: pendingAuth.codeVerifier,
    })
    await clearPendingAuth()
    await saveTokens(tokens)
    return tokens
}

async function refreshTokens(tokens) {
    // Native Android path: ask Play services for a fresh access token.
    // This avoids the token endpoint entirely (and therefore the
    // client_secret requirement) by re-running the authorization client.
    if (Capacitor.isNativePlatform()) {
        if (!tokens?.refresh_token) return null
        try {
            const result = await HosnoteConfig.authorizeGoogleDrive({
                scope: DRIVE_SCOPE,
                offline: true,
            })
            const refreshed = buildTokensFromAuthorizationResult(result)
            // Preserve the refresh token we already hold when the SDK does
            // not return a new one.
            if (!refreshed.refresh_token) {
                refreshed.refresh_token = tokens.refresh_token
            }
            const merged = { ...tokens, ...refreshed }
            await saveTokens(merged)
            return merged
        } catch {
            return null
        }
    }

    // Web path: Silent background refresh via Vercel serverless backend
    try {
        const clientKey = typeof localStorage !== 'undefined' ? localStorage.getItem(WEB_CLIENT_KEY) : null
        if (!clientKey) return null

        const res = await fetch('/api/drive/token', {
            headers: { 'x-hosnote-client-key': clientKey },
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data.access_token) {
            if (data.connected === false) {
                await clearTokens()
                clearWebDriveKey()
            }
            return null
        }

        const refreshed = {
            ...(tokens || {}),
            access_token: data.access_token,
            refresh_token: 'server_managed',
            scope: DRIVE_SCOPE,
            token_type: 'Bearer',
            expires_in: Number(data.expires_in) || 3600,
            expires_at: data.expires_at || (Date.now() + 3600 * 1000),
            state: 'backend',
            email: data.email || tokens?.email || null,
        }
        await saveTokens(refreshed)
        return refreshed
    } catch {
        return null
    }
}

export async function getGoogleDriveAccessToken() {
    let tokens = await getTokens()
    if (!tokens) {
        if (!Capacitor.isNativePlatform() && typeof localStorage !== 'undefined' && localStorage.getItem(WEB_CLIENT_KEY)) {
            tokens = await refreshTokens(null)
            if (tokens?.access_token) return tokens.access_token
        }
        return null
    }
    if (tokens.expires_at && tokens.expires_at > Date.now() + 60 * 1000) return tokens.access_token

    try {
        tokens = await refreshTokens(tokens)
    } catch {
        return null
    }
    return tokens?.access_token || null
}

async function driveRequest(path, options = {}, upload = false) {
    const accessToken = await getGoogleDriveAccessToken()
    if (!accessToken) {
        throw new Error('Your Google Drive authorization has expired. Please reconnect.')
    }

    const root = upload ? DRIVE_UPLOAD_ROOT : DRIVE_API_ROOT
    const requestUrl = `${root}/${path.replace(/^\//, '')}`
    let response
    try {
        response = await fetch(requestUrl, {
            ...options,
            headers: {
                Authorization: `Bearer ${accessToken}`,
                ...(options.headers || {}),
            },
        })
    } catch {
        throw new Error('Unable to connect to Google Drive. Please check your internet connection and try again.')
    }

    if (response.status === 401) {
        const tokens = await getTokens()
        let refreshed
        try {
            refreshed = await refreshTokens(tokens)
        } catch {
            throw new Error('Your Google Drive authorization has expired. Please reconnect.')
        }
        if (!refreshed?.access_token) {
            throw new Error('Your Google Drive authorization has expired. Please reconnect.')
        }
        let retry
        try {
            retry = await fetch(requestUrl, {
                ...options,
                headers: {
                    Authorization: `Bearer ${refreshed.access_token}`,
                    ...(options.headers || {}),
                },
            })
        } catch {
            throw new Error('Unable to connect to Google Drive. Please check your internet connection and try again.')
        }
        return parseDriveResponse(retry)
    }

    return parseDriveResponse(response)
}

async function parseDriveResponse(response) {
    const contentType = response.headers.get('content-type') || ''
    const payload = contentType.includes('application/json')
        ? await response.json().catch(() => ({}))
        : await response.text()
    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('Your Google Drive authorization has expired. Please reconnect.')
        }
        if (response.status === 403) {
            throw new Error('Google Drive permission error. Please reconnect to grant access to HOsNote files.')
        }
        if (response.status === 404) {
            throw new Error('Requested backup file was not found on Google Drive.')
        }
        const msg = payload?.error?.message || payload?.error
        throw new Error(msg || `Google Drive request failed (${response.status})`)
    }
    return payload
}

function backupQuery() {
    const query = `name = '${BACKUP_FILE_NAME}' and trashed = false and mimeType = '${BACKUP_MIME_TYPE}'`
    return encodeURIComponent(query)
}

export async function findGoogleDriveBackup() {
    const result = await driveRequest(`files?q=${backupQuery()}&fields=files(id,name,modifiedTime,size,appProperties,webViewLink)&pageSize=10&orderBy=modifiedTime desc`)
    return result.files?.[0] || null
}

export async function getGoogleDriveUserInfo() {
    try {
        const about = await driveRequest('about?fields=user(displayName,emailAddress,photoLink)')
        return about?.user || null
    } catch {
        return null
    }
}

export async function getGoogleDriveBackupMetadata() {
    try {
        const file = await findGoogleDriveBackup()
        if (!file) return { exists: false, file: null }
        return {
            exists: true,
            file,
            lastBackupTime: file.appProperties?.updatedAt || file.modifiedTime,
            recordCount: Number(file.appProperties?.recordCount || 0),
            size: Number(file.size || 0),
            webViewLink: file.webViewLink,
        }
    } catch {
        return { exists: false, file: null }
    }
}

function createMultipart(metadata, content) {
    const boundary = `hosnote_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const encoder = new TextEncoder()
    const metadataBytes = encoder.encode(JSON.stringify(metadata))
    const contentBytes = encoder.encode(content)
    const header = encoder.encode(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`)
    const separator = encoder.encode(`\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n`)
    const footer = encoder.encode(`\r\n--${boundary}--\r\n`)
    return new Blob([header, metadataBytes, separator, contentBytes, footer], {
        type: `multipart/related; boundary=${boundary}`,
    })
}

export async function uploadGoogleDriveBackup(snapshot) {
    const content = JSON.stringify(snapshot)
    const metadata = {
        name: BACKUP_FILE_NAME,
        mimeType: BACKUP_MIME_TYPE,
        description: 'HOsNote automatic backup',
        appProperties: {
            hosnoteBackup: 'true',
            schemaVersion: String(snapshot.__v || 1),
            updatedAt: snapshot.exportedAt,
            deviceId: snapshot.deviceId || '',
            recordCount: String(snapshot.recordCount || 0),
            snapshotHash: snapshot.hash || '',
        },
    }
    const body = createMultipart(metadata, content)
    const existing = await findGoogleDriveBackup()
    const queryFields = 'fields=id,name,modifiedTime,size,appProperties,webViewLink'
    const path = existing
        ? `files/${encodeURIComponent(existing.id)}?uploadType=multipart&${queryFields}`
        : `files?uploadType=multipart&${queryFields}`
    const method = existing ? 'PATCH' : 'POST'
    const file = await driveRequest(path, {
        method,
        headers: { 'Content-Type': body.type },
        body,
    }, true)
    return { file, created: !existing }
}

export async function downloadGoogleDriveBackup(file) {
    const content = await driveRequest(`files/${encodeURIComponent(file.id)}?alt=media`, {
        headers: { Accept: 'application/json' },
    })
    return typeof content === 'string' ? JSON.parse(content) : content
}

export async function deleteGoogleDriveBackup(file) {
    if (!file?.id) return
    await driveRequest(`files/${encodeURIComponent(file.id)}`, { method: 'DELETE' })
}

export async function getGoogleDriveConnectionState() {
    if (Capacitor.isNativePlatform()) {
        return Boolean(await getTokens())
    }
    const hasKey = typeof localStorage !== 'undefined' && Boolean(localStorage.getItem(WEB_CLIENT_KEY))
    const tokens = await getTokens()
    return Boolean(tokens || hasKey)
}

export async function disconnectGoogleDrive() {
    // Native Android path: revoke access through Play services so Google
    // stops issuing tokens for this app, in addition to clearing the
    // local cache. Best-effort — the local cache is cleared regardless.
    if (Capacitor.isNativePlatform()) {
        try {
            await HosnoteConfig.revokeGoogleDrive()
        } catch {
            // Ignore; local cache is cleared below regardless.
        }
    } else {
        // Web path: revoke refresh token and remove session on Vercel backend
        try {
            const clientKey = typeof localStorage !== 'undefined' ? localStorage.getItem(WEB_CLIENT_KEY) : null
            if (clientKey) {
                await fetch('/api/drive/disconnect', {
                    method: 'POST',
                    headers: { 'x-hosnote-client-key': clientKey },
                }).catch(() => null)
            }
        } catch {
            // Ignore
        }
        clearWebDriveKey()
    }
    await clearTokens()
    await clearPendingAuth()
}

export function listenForGoogleDriveRedirect(callback, onCancel) {
    if (!isGoogleDriveSupported()) return () => {}
    let active = true
    let listenerHandle = null
    let browserFinishedHandle = null
    let appStateHandle = null
    let authHandled = false
    let wasBackgrounded = false

    const listener = event => {
        if (!active || !event?.url) return
        authHandled = true
        try {
            callback(event.url)
        } catch {
            // The caller owns error reporting.
        }
    }

    if (Capacitor.isNativePlatform()) {
        App.addListener('appUrlOpen', listener)
            .then(handle => {
                if (active) listenerHandle = handle
            })
            .catch(() => undefined)

        App.getLaunchUrl().then(launch => {
            if (active && launch?.url) {
                authHandled = true
                callback(launch.url)
            }
        }).catch(() => undefined)

        // The Android flow now opens the device's DEFAULT external browser via
        // HosnoteConfig.openExternalUrl(), so Capacitor's Custom Tabs
        // 'browserFinished' event never fires and can no longer be used to
        // detect cancellation. Instead, watch for the app returning to the
        // foreground: if the user comes back to HOsNote without Google having
        // delivered the com.hosnote.app:/oauth2redirect callback, they either
        // cancelled or the flow failed, and the spinner must stop.
        App.addListener('appStateChange', (data) => {
            // DIAGNOSTIC: log every appStateChange so we can see whether a
            // screen-off/on cycle fires isActive=true with no auth in progress.
            try {
                console.log('[GoogleDrive] appStateChange', JSON.stringify({
                    isActive: data?.isActive,
                    authHandled,
                    wasBackgrounded,
                }))
            } catch {}
            if (!active) return
            if (data?.isActive) {
                if (!authHandled) {
                    wasBackgrounded = true
                    // Give the deep-link a brief moment to arrive before
                    // reporting cancellation.
                    setTimeout(() => {
                        if (active && !authHandled) {
                            try {
                                console.log('[GoogleDrive] onCancel fired', JSON.stringify({ authHandled, wasBackgrounded }))
                            } catch {}
                            onCancel?.('Google Drive sign-in was cancelled.')
                        }
                    }, 600)
                }
            }
        }).then(handle => {
            if (active) appStateHandle = handle
        }).catch(() => undefined)

        // Kept for compatibility with any platform that still uses
        // Capacitor's Browser plugin (e.g. web/PWA Custom Tabs).
        Browser.addListener('browserFinished', () => {
            if (!active) return
            setTimeout(() => {
                if (active && !authHandled) {
                    onCancel?.('Google Drive sign-in was cancelled.')
                }
            }, 350)
        }).then(handle => {
            if (active) browserFinishedHandle = handle
        }).catch(() => undefined)
    }

    return () => {
        active = false
        if (listenerHandle?.remove) listenerHandle.remove().catch(() => undefined)
        if (browserFinishedHandle?.remove) browserFinishedHandle.remove().catch(() => undefined)
        if (appStateHandle?.remove) appStateHandle.remove().catch(() => undefined)
    }
}
