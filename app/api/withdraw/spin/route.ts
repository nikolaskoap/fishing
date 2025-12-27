import { redis } from '@/lib/redis'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const { userId, walletAddress, amountUSDC } = await req.json()
        const usdcToWithdraw = parseFloat(amountUSDC)

        if (!userId || !walletAddress || isNaN(usdcToWithdraw) || usdcToWithdraw <= 0) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
        }

        // 1. Session Check
        const sessionActive = await redis.exists(`auth:session:${userId}`)
        if (!sessionActive) return NextResponse.json({ error: 'UNAUTHORIZED_SESSION' }, { status: 401 })

        const userKey = `user:${userId}`
        const userData: any = await redis.hgetall(userKey)
        const currentBalance = parseFloat(userData.spin_rewards_usdc || "0")

        if (currentBalance < usdcToWithdraw) {
            return NextResponse.json({ error: 'INSUFFICIENT_BALANCE' }, { status: 400 })
        }

        // 2. Atomic Balance Deduction
        await redis.hincrbyfloat(userKey, 'spin_rewards_usdc', -usdcToWithdraw)

        const withdrawId = `spin_wd_${Date.now()}_${userId}`
        const withdrawRequest = {
            id: withdrawId,
            userId,
            walletAddress,
            amountUSDC: usdcToWithdraw,
            status: 'pending',
            type: 'SPIN',
            createdAt: new Date().toISOString()
        }

        await redis.lpush('withdrawals:pending', JSON.stringify(withdrawRequest))
        await redis.lpush(`audit:withdraw:${userId}`, JSON.stringify(withdrawRequest))

        return NextResponse.json({ success: true, id: withdrawId })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
