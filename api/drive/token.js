import { prisma } from '../lib/prisma.js'
import { hashClientKey, decryptToken } from '../lib/crypto.js'

export default async function handler(req, res) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json({ ok: false, error: `Method ${req.method} Not Allowed` })
    }

    const clientKey = req.headers['x-hosnote-client-key'] || (req.body && req.body.clientKey)
    if (!clientKey || typeof clientKey !== 'string') {
        return res.status(401).json({
            ok: false,
            error: 'Missing x-hosnote-client-key authorization header.',
        })
    }

    const clientKeyHash = hashClientKey(clientKey)

    let session = null
    try {
        session = await prisma.webDriveSession.findUnique({
            where: { clientKeyHash },
        })
    } catch (dbErr) {
        console.error('Failed to query WebDriveSession:', dbErr)
        return res.status(500).json({ ok: false, error: 'Database error reading session.' })
    }

    if (!session) {
        return res.status(401).json({
            ok: false,
            error: 'Google Drive is not connected on this browser.',
            connected: false,
        })
    }

    const now = Date.now()
    const cachedExpiresAt = session.expiresAt ? new Date(session.expiresAt).getTime() : 0

    // 1. If cached access token has at least 60 seconds of validity remaining, return it immediately
    if (session.accessToken && cachedExpiresAt > now + 60 * 1000) {
        return res.status(200).json({
            ok: true,
            access_token: session.accessToken,
            expires_in: Math.floor((cachedExpiresAt - now) / 1000),
            expires_at: cachedExpiresAt,
            email: session.googleEmail || null,
        })
    }

    // 2. Token expired or not cached -> refresh using durable encrypted refresh token
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_WEB_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    if (!clientId || !clientSecret) {
        return res.status(500).json({
            ok: false,
            error: 'Server configuration error: Google client credentials missing.',
        })
    }

    let refreshToken = null
    try {
        refreshToken = decryptToken(session.encryptedRefreshToken)
    } catch (cryptoErr) {
        console.error('Failed to decrypt refresh token:', cryptoErr)
        return res.status(500).json({
            ok: false,
            error: 'Failed to decrypt authorization credentials.',
        })
    }

    try {
        const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: refreshToken,
                grant_type: 'refresh_token',
            }),
        })

        const refreshData = await refreshRes.json()

        if (!refreshRes.ok) {
            console.warn('Google refresh token rejected:', refreshData)
            if (refreshData.error === 'invalid_grant') {
                // Refresh token was revoked by user or expired on Google's end
                await prisma.webDriveSession.delete({
                    where: { clientKeyHash },
                }).catch(() => null)
                return res.status(401).json({
                    ok: false,
                    error: 'Google Drive authorization was revoked or expired. Please reconnect.',
                    connected: false,
                })
            }
            return res.status(502).json({
                ok: false,
                error: refreshData.error_description || 'Failed to refresh Google Drive token.',
            })
        }

        const expiresIn = Number(refreshData.expires_in) || 3600
        const expiresAt = new Date(Date.now() + expiresIn * 1000)

        // Update cached access token in Postgres
        await prisma.webDriveSession.update({
            where: { clientKeyHash },
            data: {
                accessToken: refreshData.access_token,
                expiresAt,
            },
        })

        return res.status(200).json({
            ok: true,
            access_token: refreshData.access_token,
            expires_in: expiresIn,
            expires_at: expiresAt.getTime(),
            email: session.googleEmail || null,
        })
    } catch (networkErr) {
        console.error('Network error during Google token refresh:', networkErr)
        return res.status(502).json({
            ok: false,
            error: 'Failed to reach Google token servers. Please check connection.',
        })
    }
}
