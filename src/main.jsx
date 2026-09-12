import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import App from './App.jsx'
import './index.css'

const Router = Capacitor.isNativePlatform() ? HashRouter : BrowserRouter

// Conditionally load analytics only when online to prevent hangs on WiFi without internet
function ConditionalAnalytics() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!isOnline) return null

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
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
        <React.Suspense fallback={null}>
          <ConditionalAnalytics />
        </React.Suspense>
    </React.StrictMode>,
)
