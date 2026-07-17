import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * useWakeLock
 * Keeps the device screen awake while `active` is true using the Screen Wake
 * Lock API. Falls back gracefully when the API is unavailable (e.g. desktop
 * browsers, insecure contexts) by simply doing nothing.
 *
 * @param {boolean} active - when true, requests a wake lock; when false, releases it.
 * @returns {{ supported: boolean, locked: boolean, error: string|null, request: () => void, release: () => void }}
 */
export default function useWakeLock(active = true) {
    const [supported, setSupported] = useState(
        typeof navigator !== 'undefined' && 'wakeLock' in navigator
    )
    const [locked, setLocked] = useState(false)
    const [error, setError] = useState(null)
    const lockRef = useRef(null)
    const activeRef = useRef(active)
    activeRef.current = active

    const release = useCallback(async () => {
        try {
            if (lockRef.current) {
                await lockRef.current.release()
            }
        } catch {
            /* ignore release errors */
        } finally {
            lockRef.current = null
            setLocked(false)
        }
    }, [])

    const request = useCallback(async () => {
        if (!supported) return
        if (lockRef.current) return // already held
        try {
            lockRef.current = await navigator.wakeLock.request('screen')
            setLocked(true)
            setError(null)
            // If the lock is released externally (e.g. tab hidden), clear state.
            lockRef.current.addEventListener?.('release', () => {
                setLocked(false)
                lockRef.current = null
            })
        } catch (err) {
            setError(err?.message || 'Wake lock failed')
            setLocked(false)
        }
    }, [supported])

    useEffect(() => {
        let cancelled = false
        if (activeRef.current) {
            request()
        } else {
            release()
        }
        return () => {
            cancelled = true
            release()
            if (cancelled) { /* noop, just for lint */ }
        }
    }, [active, request, release])

    // Re-acquire the lock automatically when the page becomes visible again
    // (browsers drop the wake lock when the tab is hidden).
    useEffect(() => {
        if (!supported) return
        const onVisibility = () => {
            if (document.visibilityState === 'visible' && activeRef.current) {
                request()
            }
        }
        document.addEventListener('visibilitychange', onVisibility)
        return () => document.removeEventListener('visibilitychange', onVisibility)
    }, [supported, request])

    return { supported, locked, error, request, release }
}
