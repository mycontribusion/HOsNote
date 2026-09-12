import { App } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'
import { SecureStorage } from '@aparajita/capacitor-secure-storage'

const STORAGE_PREFIX = 'hosnote_google_'
const TOKEN_KEY = 'tokens'
const PENDING_AUTH_KEY = 'pending_auth'
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file'
const BACKUP_FILE_NAME = 'HOsNote Backup'
const BACKUP_MIME_TYPE = 'application/json'
const NATIVE_REDIRECT_URI = 'com.hosnote.app:/oauth2redirect'
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
    return SecureStorage
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
    return `${window.location.origin}/oauth2redirect`
}

export function getGoogleDriveConfig() {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
    const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI || getRedirectUri()

    if (!clientId) {
        throw new Error('Google Drive is not configured. Add VITE_GOOGLE_CLIENT_ID to the environment.')
    }

    return { clientId, redirectUri }
}

export function isGoogleDriveSupported() {
    return Capacitor.isNativePlatform()
}

async function getTokens() {
    const store = await storage()
    const raw = await store.get(TOKEN_KEY)
    if (!raw) return null
    try {
        const tokens = typeof raw === 'string' ? JSON.parse(raw) : raw
        return tokens && tokens.access_token ? tokens : null
    } catch {
        await store.remove(TOKEN_KEY)
        return null
    }
}

async function saveTokens(tokens) {
    const store = await storage()
    await store.set(TOKEN_KEY, tokens)
}

async function clearTokens() {
    const store = await storage()
    await store.remove(TOKEN_KEY)
}

async function savePendingAuth(pendingAuth) {
    const store = await storage()
    await store.set(PENDING_AUTH_KEY, JSON.stringify(pendingAuth))
}

async function getPendingAuth() {
    const store = await storage()
    const raw = await store.get(PENDING_AUTH_KEY)
    if (!raw) return null
    try {
        return typeof raw === 'string' ? JSON.parse(raw) : raw
    } catch {
        await store.remove(PENDING_AUTH_KEY)
        return null
    }
}

async function clearPendingAuth() {
    const store = await storage()
    await store.remove(PENDING_AUTH_KEY)
}

async function tokenRequest(parameters) {
    const response = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(parameters),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
        throw new Error(payload.error_description || payload.error || 'Google authentication failed')
    }
    return {
        ...payload,
        expires_at: Date.now() + Number(payload.expires_in || 3600) * 1000,
    }
}

export async function startGoogleDriveAuth() {
    if (!isGoogleDriveSupported()) {
        throw new Error('Google Drive backup is currently available in the Android app.')
    }

    const { clientId, redirectUri } = getGoogleDriveConfig()
    const state = randomBase64Url(32)
    const codeVerifier = randomBase64Url(64)
    const codeChallenge = await sha256Base64Url(codeVerifier)
    const pendingAuth = { state, codeVerifier, createdAt: Date.now() }
    await savePendingAuth(pendingAuth)

    const authUrl = new URL(AUTH_ENDPOINT)
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', DRIVE_SCOPE)
    authUrl.searchParams.set('access_type', 'offline')
    authUrl.searchParams.set('prompt', 'consent')
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('code_challenge', codeChallenge)
    authUrl.searchParams.set('code_challenge_method', 'S256')

    await Browser.open({ url: authUrl.toString(), windowName: '_blank' })
    return state
}

export async function completeGoogleDriveAuth(url) {
    const parsed = new URL(url)
    const error = parsed.searchParams.get('error')
    if (error) throw new Error(parsed.searchParams.get('error_description') || error)

    const code = parsed.searchParams.get('code')
    const state = parsed.searchParams.get('state')
    if (!code || !state) throw new Error('Google returned an incomplete authorization response')

    const pendingAuth = await getPendingAuth()
    if (!pendingAuth || pendingAuth.state !== state) throw new Error('Google authorization state did not match')
    if (Date.now() - pendingAuth.createdAt > 10 * 60 * 1000) throw new Error('Google authorization expired')

    const { clientId, redirectUri } = getGoogleDriveConfig()
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
    if (!tokens?.refresh_token) return null
    const { clientId } = getGoogleDriveConfig()
    const refreshed = await tokenRequest({
        client_id: clientId,
        refresh_token: tokens.refresh_token,
        grant_type: 'refresh_token',
    })
    const merged = { ...tokens, ...refreshed }
    await saveTokens(merged)
    return merged
}

export async function getGoogleDriveAccessToken() {
    let tokens = await getTokens()
    if (!tokens) return null
    if (tokens.expires_at && tokens.expires_at > Date.now() + 60 * 1000) return tokens.access_token

    tokens = await refreshTokens(tokens)
    return tokens?.access_token || null
}

async function driveRequest(path, options = {}, upload = false) {
    const accessToken = await getGoogleDriveAccessToken()
    if (!accessToken) throw new Error('Google Drive is not connected')

    const root = upload ? DRIVE_UPLOAD_ROOT : DRIVE_API_ROOT
    const requestUrl = `${root}/${path.replace(/^\//, '')}`
    const response = await fetch(requestUrl, {
        ...options,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            ...(options.headers || {}),
        },
    })

    if (response.status === 401) {
        const tokens = await getTokens()
        const refreshed = await refreshTokens(tokens)
        if (!refreshed?.access_token) throw new Error('Google Drive authentication expired')
        const retry = await fetch(requestUrl, {
            ...options,
            headers: {
                Authorization: `Bearer ${refreshed.access_token}`,
                ...(options.headers || {}),
            },
        })
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
        throw new Error(payload?.error?.message || payload?.error || `Drive request failed (${response.status})`)
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
    const path = existing ? `files/${encodeURIComponent(existing.id)}?uploadType=multipart` : 'files?uploadType=multipart'
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
    return Boolean(await getTokens())
}

export async function disconnectGoogleDrive() {
    await clearTokens()
    await clearPendingAuth()
}

export function listenForGoogleDriveRedirect(callback) {
    if (!isGoogleDriveSupported()) return () => {}
    let active = true
    let listenerHandle = null
    const listener = event => {
        if (!active || !event?.url) return
        try {
            callback(event.url)
        } catch {
            // The caller owns error reporting.
        }
    }

    App.addListener('appUrlOpen', listener)
        .then(handle => {
            if (active) listenerHandle = handle
        })
        .catch(() => undefined)

    App.getLaunchUrl().then(launch => {
        if (active && launch?.url) callback(launch.url)
    }).catch(() => undefined)

    return () => {
        active = false
        if (listenerHandle?.remove) listenerHandle.remove().catch(() => undefined)
    }
}
