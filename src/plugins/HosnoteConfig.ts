import { registerPlugin } from '@capacitor/core'

/**
 * TypeScript wrapper for the HosnoteConfig Capacitor plugin.
 *
 * On native (Android/iOS) platforms the plugin reads the Google OAuth
 * client ID that Gradle injected via {@code buildConfigField}.
 * On web/PWA the plugin is a no-op stub; callers should fall back to
 * the Vite environment variable {@code VITE_GOOGLE_WEB_CLIENT_ID}.
 */
export interface HosnoteConfigPlugin {
    /** Returns the Android client ID baked into the APK at build time. */
    getGoogleClientId(): Promise<{ clientId: string }>

    /**
     * Returns the Web OAuth client ID baked into the APK at build time.
     *
     * The native Android app authenticates with a *Web* application OAuth
     * client (see {@code getGoogleDriveConfig}) because Google rejects HTTPS
     * redirect URIs for Android client types with "redirect_uri_mismatch",
     * while custom-scheme redirects for Android clients are blocked by
     * default. A Web client accepts the HTTPS App Link redirect, which
     * Android then delivers back to HOsNote via the autoVerify intent-filter.
     */
    getGoogleWebClientId(): Promise<{ clientId: string }>

    /**
     * Opens the given URL in the device's default external browser using an
     * Android {@code ACTION_VIEW} intent.
     *
     * This is intentionally different from Capacitor's {@code Browser}
     * plugin, which launches Custom Tabs (in-app browser component).
     * With Custom Tabs, Google's redirect back to
     * {@code com.hosnote.app:/oauth2redirect} is never delivered to
     * HOsNote, so the OAuth callback is lost and the Connect button spins
     * forever. Using a normal {@code ACTION_VIEW} intent lets the system
     * resolve the URL to the user's default browser (Chrome, Firefox, ...)
     * so that browser's existing Google session is available to the OAuth
     * page and the redirect is delivered back to HOsNote.
     *
     * @param url the absolute URL to open.
     */
    openExternalUrl(options: { url: string }): Promise<void>

    /**
     * Requests Google OAuth authorization for the given scope(s) using the
     * current officially supported Android authorization API
     * ({@code com.google.android.gms.auth.api.identity.AuthorizationClient}).
     *
     * <p>This is the native Android authorization path. Play services
     * resolves the account, shows the consent screen, and returns the
     * access token directly — no authorization-code exchange, no token
     * endpoint call, and no client secret are involved. The Android OAuth
     * client baked into the APK via
     * {@code BuildConfig.GOOGLE_CLIENT_ID} is the only credential.</p>
     *
     * <p>The {@code scope} parameter defaults to
     * {@code https://www.googleapis.com/auth/drive.file} (the
     * {@code Scopes.DRIVE_FILE} equivalent). Additional scopes may be
     * passed as a comma-separated string.</p>
     *
     * <p>The returned payload contains:</p>
     * <ul>
     *   <li>{@code accessToken} — the access token to use for Drive API
     *       calls;</li>
     *   <li>{@code grantedScopes} — the list of scopes actually granted;</li>
     *   <li>{@code refreshToken} — present when {@code offline} is true
     *       and a refresh token was issued;</li>
     *   <li>{@code expiresInSeconds} — token lifetime, when available.</li>
     * </ul>
     *
     * @param options.scope    optional scope string (default drive.file).
     * @param options.prompt   optional {@code AuthorizationRequest.Prompt}
     *                         value (e.g. {@code CONSENT}).
     * @param options.offline  request a refresh token (default true).
     */
    authorizeGoogleDrive(options?: {
        scope?: string
        prompt?: string
        offline?: boolean
    }): Promise<{
        accessToken: string
        grantedScopes: string[]
        refreshToken?: string
        expiresInSeconds?: string
        hasResolution?: boolean
    }>

    /**
     * Revokes the application's access to the Google account and clears the
     * local token cache, using
     * {@code AuthorizationClient.revokeAccess(RevokeAccessRequest)}.
     *
     * Best-effort: failures are swallowed so the local token cache can still
     * be cleared by the caller.
     */
    revokeGoogleDrive(): Promise<void>
}

const HosnoteConfig = registerPlugin<HosnoteConfigPlugin>('HosnoteConfig')

export { HosnoteConfig }
