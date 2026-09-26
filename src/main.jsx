import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import App from './App.jsx'
import './index.css'

const Router = Capacitor.isNativePlatform() ? HashRouter : BrowserRouter

// Check for real internet connectivity with a fast timeout.
// Note: navigator.onLine is true whenever connected to a local WiFi/LAN interface,
// even if the router has NO internet connection (dead WiFi, hospital intranet).
async function verifyInternetAccess(timeoutMs = 1500) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return false
  }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    await Promise.any([
      fetch('https://connectivitycheck.gstatic.com/generate_204', {
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal,
      }),
      fetch('/_vercel/insights/script.js', {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      }),
    ])
    return true
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

// Conditionally load analytics only when real internet is verified.
function ConditionalAnalytics() {
  // Never load analytics in Capacitor native app, or during initial cold start.
  // Start as false so initial page render is NEVER delayed or suspended.
  const [canLoadAnalytics, setCanLoadAnalytics] = useState(false)

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return

    let isMounted = true

    // Delay verification until 3s after startup so local data and UI render immediately
    const checkTimer = setTimeout(() => {
      verifyInternetAccess(1500).then((isReachable) => {
        if (isMounted && isReachable) {
          setCanLoadAnalytics(true)
        }
      })
    }, 3000)

    const handleOnline = () => {
      verifyInternetAccess(1500).then((isReachable) => {
        if (isMounted) setCanLoadAnalytics(isReachable)
      })
    }
    const handleOffline = () => {
      if (isMounted) setCanLoadAnalytics(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      isMounted = false
      clearTimeout(checkTimer)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!canLoadAnalytics) return null

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  )
}

// Lazy load analytics to avoid blocking initial render
const Analytics = React.lazy(() => import('@vercel/analytics/react').then(m => ({ default: m.Analytics })))
const SpeedInsights = React.lazy(() => import('@vercel/speed-insights/react').then(m => ({ default: m.SpeedInsights })))

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
                <Route path="/" element={<Navigate to="/team/my_team" replace />} />
                <Route path="/team/:tab" element={<App />}>
                    <Route path="add" element={<App />} />
                    <Route path="edit" element={<App />} />
                    <Route path="handover" element={<App />} />
                    <Route path="handover/:name" element={<App />} />
                    {/* "recieve" (misspelled) kept as backwards-compat alias for "receive" */}
                    <Route path="recieve" element={<App />} />
                    <Route path="receive" element={<App />} />
                    <Route path="receive/:name" element={<App />} />
                </Route>
                <Route path="/mortalities" element={<App />} />
                <Route path="/discarded-drafts" element={<App />} />
                <Route path="/settings" element={<App />} />
                <Route path="/search" element={<App />} />
                <Route path="/demo" element={<App />} />
                <Route path="/notebook" element={<App />} />
                <Route path="/notebook/add" element={<App />} />
                <Route path="/notebook/edit" element={<App />} />
                <Route path="/notebook/handover" element={<App />} />
                <Route path="/notebook/receive" element={<App />} />
                <Route path="/privacy" element={<App />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
        <React.Suspense fallback={null}>
          <ConditionalAnalytics />
        </React.Suspense>
    </React.StrictMode>,
)
