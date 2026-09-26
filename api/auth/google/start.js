import { prisma } from '../../lib/prisma.js'
import { hashClientKey, randomToken } from '../../lib/crypto.js'

export default async function handler(req, res) {
    if (req.method !== 'POST' && req.method !== 'GET') {
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json({ ok: false, error: `Method ${req.method} Not Allowed` })
    }

    const clientKey = req.headers['x-hosnote-client-key'] || (req.body && req.body.clientKey)
    if (!clientKey || typeof clientKey !== 'string' || clientKey.length < 16) {
        return res.status(400).json({
            ok: false,
            error: 'Missing or invalid x-hosnote-client-key header',
        })
    }

    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_WEB_CLIENT_ID
    if (!clientId) {
        return res.status(500).json({
            ok: false,
            error: 'Google Client ID is not configured on this server.',
        })
    }

    try {
        const clientKeyHash = hashClientKey(clientKey)
        const state = randomToken(32)
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes TTL

        // Clean up expired transactions and insert new transaction
        await prisma.oAuthTransaction.deleteMany({
            where: {
                OR: [
                    { expiresAt: { lt: new Date() } },
                    { clientKeyHash },
                ],
            },
        }).catch(() => null)

        await prisma.oAuthTransaction.create({
            data: {
                state,
                clientKeyHash,
                expiresAt,
            },
        })

        // Determine redirect URI: use configured GOOGLE_REDIRECT_URI or infer from host
        const host = req.headers['x-forwarded-host'] || req.headers.host || 'hosnote.vercel.app'
        const proto = host.includes('localhost') ? 'http' : 'https'
        const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${proto}://${host}/api/auth/google/callback`

        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email',
            access_type: 'offline',
            prompt: 'consent',
            state,
        })

        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

        return res.status(200).json({
            ok: true,
            authUrl,
            state,
        })
    } catch (error) {
        console.error('Failed to initiate Google OAuth:', error)
        return res.status(500).json({
            ok: false,
            error: 'Failed to initiate Google authorization.',
        })
    }
}
