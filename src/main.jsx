import React from 'react'
import ReactDOM from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import App from './App.jsx'
import './index.css'

const Router = Capacitor.isNativePlatform() ? HashRouter : BrowserRouter

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
                <Route path="/" element={<Navigate to="/team/my_team" replace />} />
                <Route path="/team/:tab" element={<App />}>
                    <Route path="add" element={<App />} />
                    <Route path="edit/:id" element={<App />} />
                    <Route path="handover" element={<App />} />
                    <Route path="handover/:name" element={<App />} />
                    <Route path="recieve" element={<App />} />
                    <Route path="receive" element={<App />} />
                    <Route path="receive/:name" element={<App />} />
                </Route>
                <Route path="/notebook" element={<App />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
        <Analytics />
        <SpeedInsights />
    </React.StrictMode>,
)
