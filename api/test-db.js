import { prisma } from './lib/prisma.js'

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET'])
        return res.status(405).json({
            ok: false,
            error: `Method ${req.method} Not Allowed`,
        })
    }

    try {
        // Harmless read/count against BackendTest
        const count = await prisma.backendTest.count()

        return res.status(200).json({
            ok: true,
            status: 'connected',
            message: 'Database connection successful',
            table: 'BackendTest',
            recordCount: count,
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        console.error('Database connection test failed:', error)
        return res.status(500).json({
            ok: false,
            status: 'error',
            message: 'Failed to connect to database',
            error: error?.message || 'Unknown database error',
            timestamp: new Date().toISOString(),
        })
    }
}
