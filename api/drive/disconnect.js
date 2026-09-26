import { prisma } from '../lib/prisma.js'
import { hashClientKey, decryptToken } from '../lib/crypto.js'

export default async function handler(req, res) {
    if (req.method !== 'POST' && req.method !== 'DELETE') {
        res.setHeader('Allow', ['POST', 'DELETE'])
        return res.status(405).json({ ok: false, error: `Method ${req.method} Not Allowed` })
    }

    const clientKey = req.headers['x-hosnote-client-key'] || (req.body && req.body.clientKey)
    if (!clientKey || typeof clientKey !== 'string') {
        return res.status(400).json({
            ok: false,
            error: 'Missing x-hosnote-client-key header.',
        })
    }

    const clientKeyHash = hashClientKey(clientKey)

    try {
        const session = await prisma.webDriveSession.findUnique({
            where: { clientKeyHash },
        })

        if (session) {
            // Revoke refresh token at Google if possible (best-effort)
            try {
                const refreshToken = decryptToken(session.encryptedRefreshToken)
                if (refreshToken) {
                    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(refreshToken)}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    }).catch(() => null)
                }
            } catch {
                // Ignore decryption failure on disconnect
            }

            await prisma.webDriveSession.delete({
                where: { clientKeyHash },
            })
        }

        return res.status(200).json({
            ok: true,
            message: 'Google Drive disconnected successfully.',
        })
    } catch (error) {
        console.error('Error during Google Drive disconnect:', error)
        return res.status(500).json({
            ok: false,
            error: 'Failed to disconnect Google Drive session.',
        })
    }
}
