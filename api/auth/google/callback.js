import { prisma } from '../../lib/prisma.js'
import { encryptToken } from '../../lib/crypto.js'

function renderHtml(res, { success, message, error }) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    const title = success ? 'Google Drive Connected' : 'Google Drive Connection Failed'
    const color = success ? '#166534' : '#991b1b'
    const defaultMsg = success
        ? 'Authorization complete! You can close this window and return to HOsNote.'
        : 'Authorization failed. You can close this window and try connecting again.'

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; color: #1e293b; }
        .card { max-width: 440px; width: 90%; background: #ffffff; padding: 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); text-align: center; }
        h2 { margin: 0 0 12px; color: ${color}; font-size: 20px; }
        p { margin: 0 0 20px; color: #475569; font-size: 14px; line-height: 1.5; }
        .btn { display: inline-block; background: ${success ? '#166534' : '#475569'}; color: #ffffff; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; text-decoration: none; }
        .btn:hover { opacity: 0.9; }
    </style>
</head>
<body>
    <div class="card">
        <h2>${title}</h2>
        <p>${message || error || defaultMsg}</p>
        <button class="btn" onclick="window.close()">Close Window</button>
    </div>
    <script>
        try {
            if (window.opener) {
                window.opener.postMessage({
                    type: '${success ? 'HOSNOTE_GOOGLE_AUTH_SUCCESS' : 'HOSNOTE_GOOGLE_AUTH_ERROR'}',
                    success: ${Boolean(success)},
                    error: ${JSON.stringify(error || null)}
                }, '*');
            }
        } catch (e) {}
        try {
            setTimeout(function() { window.close(); }, ${success ? 1500 : 5000});
        } catch (e) {}
    </script>
</body>
</html>`

    return res.status(success ? 200 : 400).send(html)
}

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET'])
        return res.status(405).json({ ok: false, error: `Method ${req.method} Not Allowed` })
    }

    const { code, state, error: authError, error_description } = req.query || {}

    if (authError) {
        if (authError === 'access_denied') {
            return renderHtml(res, { success: false, error: 'Google Drive authorization was cancelled.' })
        }
        return renderHtml(res, { success: false, error: error_description || authError })
    }

    if (!code || !state) {
        return renderHtml(res, { success: false, error: 'Incomplete authorization response from Google.' })
    }

    // 1. Verify and consume short-lived OAuth transaction (single-use)
    let transaction = null
    try {
        transaction = await prisma.oAuthTransaction.findUnique({
            where: { state: String(state) },
        })
        if (transaction) {
            // Delete immediately to prevent replay
            await prisma.oAuthTransaction.delete({
                where: { state: String(state) },
            })
        }
    } catch (dbErr) {
        console.error('Failed to verify OAuth transaction:', dbErr)
        return renderHtml(res, { success: false, error: 'Database error validating authorization session.' })
    }

    if (!transaction || transaction.expiresAt < new Date()) {
        return renderHtml(res, {
            success: false,
            error: 'Authorization session has expired or is invalid. Please close this window and try connecting again.',
        })
    }

    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_WEB_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    if (!clientId || !clientSecret) {
        return renderHtml(res, {
            success: false,
            error: 'Server configuration error: Google client credentials missing.',
        })
    }

    // Determine redirect URI: match what was sent in start.js
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'hosnote.vercel.app'
    const proto = host.includes('localhost') ? 'http' : 'https'
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${proto}://${host}/api/auth/google/callback`

    // 2. Exchange authorization code for tokens
    let tokenData = null
    try {
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code: String(code),
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        })
        tokenData = await tokenRes.json()
        if (!tokenRes.ok) {
            console.error('Google token exchange error:', tokenData)
            return renderHtml(res, {
                success: false,
                error: tokenData.error_description || tokenData.error || 'Failed to exchange authorization code with Google.',
            })
        }
    } catch (fetchErr) {
        console.error('Network error during Google token exchange:', fetchErr)
        return renderHtml(res, { success: false, error: 'Failed to contact Google token servers. Please try again.' })
    }

    // 3. User Requirement: Must have refresh_token for durable offline access
    if (!tokenData?.refresh_token) {
        return renderHtml(res, {
            success: false,
            error: 'Google did not return a refresh token for background backups. Please disconnect HOsNote in your Google Account Security settings and reconnect.',
        })
    }

    // 4. Fetch user email for UI display (optional best-effort)
    let userEmail = null
    try {
        const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        })
        if (userRes.ok) {
            const userData = await userRes.json()
            userEmail = userData.email || null
        }
    } catch {
        // Optional
    }

    // 5. Encrypt refresh token & upsert WebDriveSession
    try {
        const encryptedRefreshToken = encryptToken(tokenData.refresh_token)
        const expiresIn = Number(tokenData.expires_in) || 3600
        const expiresAt = new Date(Date.now() + expiresIn * 1000)

        await prisma.webDriveSession.upsert({
            where: { clientKeyHash: transaction.clientKeyHash },
            create: {
                clientKeyHash: transaction.clientKeyHash,
                encryptedRefreshToken,
                accessToken: tokenData.access_token || null,
                expiresAt,
                scope: tokenData.scope || null,
                googleEmail: userEmail,
            },
            update: {
                encryptedRefreshToken,
                accessToken: tokenData.access_token || null,
                expiresAt,
                scope: tokenData.scope || null,
                googleEmail: userEmail,
            },
        })

        return renderHtml(res, {
            success: true,
            message: 'Authorization complete! You can close this window and return to HOsNote.',
        })
    } catch (saveErr) {
        console.error('Failed to save WebDriveSession:', saveErr)
        return renderHtml(res, {
            success: false,
            error: 'Failed to securely store Google Drive authorization session.',
        })
    }
}
