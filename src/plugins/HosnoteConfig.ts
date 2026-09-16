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
     * Opens the given URL in the device's default external browser using an
     * Android {@code ACTION_VIEW} intent.
     *
     * This is intentionally different from Capacitor's {@code Browser}
     * plugin, which launches Custom Tabs (an in-app browser component).
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
}

const HosnoteConfig = registerPlugin<HosnoteConfigPlugin>('HosnoteConfig')

export { HosnoteConfig }
