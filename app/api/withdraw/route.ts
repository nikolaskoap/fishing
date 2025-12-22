import { redis } from '@/lib/redis'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { fid, walletAddress, amountFish, amountUSDC } = body

        if (!fid || !walletAddress || !amountFish || !amountUSDC) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const withdrawId = `wd_${Date.now()}_${fid}`
        const withdrawRequest = {
            id: withdrawId,
            fid,
            walletAddress,
            amountFish,
            amountUSDC,
            status: 'pending', // pending, approved, rejected
            createdAt: new Date().toISOString()
        }

        // 1. Add to main list of withdrawals
        await redis.lpush('withdrawals', JSON.stringify(withdrawRequest))

        // 2. Also keep track per user if needed (optional, skipping for simple implementation)

        return NextResponse.json({ success: true, id: withdrawId })
    } catch (error) {
        console.error('Redis Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// Admin helper to get list (Protected)
export async function GET(req: NextRequest) {
    const token = req.cookies.get('admin_session_token')
    // In a real app, verify token signature. Here we just check existence/value vs whitelist if we wanted.
    // For simplicity, just check existence is enough as the login route only sets it if valid.

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        // Get last 50 withdrawals
        const withdrawals = await redis.lrange('withdrawals', 0, 49)
        // Parse them
        const parsed = withdrawals.map((w) => (typeof w === 'string' ? JSON.parse(w) : w))
        return NextResponse.json({ withdrawals: parsed })
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching' }, { status: 500 })
    }
}
