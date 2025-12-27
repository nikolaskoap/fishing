import { redis } from '@/lib/redis'
import { SWAP_CONFIG } from '@/lib/constants'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const { userId, amount } = await req.json()
        const swapAmount = parseInt(amount)

        if (!userId || isNaN(swapAmount) || swapAmount < SWAP_CONFIG.MIN_SWAP) {
            return NextResponse.json({ error: 'Invalid swap amount' }, { status: 400 })
        }

        // 1. Session Check
        const sessionActive = await redis.exists(`auth:session:${userId}`)
        if (!sessionActive) return NextResponse.json({ error: 'UNAUTHORIZED_SESSION' }, { status: 401 })

        const userKey = `user:${userId}`
        const userData: any = await redis.hgetall(userKey)
        if (!userData || Object.keys(userData).length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        // 2. Cooldown Check (24h)
        const lastSwap = parseInt(userData.lastSwapAt || "0")
        const now = Date.now()
        if (now - lastSwap < 86400000) {
            return NextResponse.json({ error: 'SWAP_COOLDOWN_ACTIVE' }, { status: 429 })
        }

        // 3. Balance Re-check (Atomic if possible, but hincrbyfloat is enough for safety)
        const currentBalance = parseFloat(userData.canFishBalance || "0")
        if (currentBalance < swapAmount) {
            return NextResponse.json({ error: 'INSUFFICIENT_BALANCE' }, { status: 400 })
        }

        // 4. Logic Calculation
        const usdcValue = (swapAmount / SWAP_CONFIG.RATE) * SWAP_CONFIG.USDC_REWARD
        const receivedUSDC = usdcValue - SWAP_CONFIG.FEE

        // Update Balance
        await redis.hincrbyfloat(userKey, 'canFishBalance', -swapAmount)
        await redis.hset(userKey, { lastSwapAt: now.toString() })

        // 5. Global Economy Tracking
        await redis.hincrbyfloat('stats:global', 'total_fish_burned', swapAmount)
        await redis.hincrbyfloat('stats:global', 'total_usdc_swap_outflow', receivedUSDC)

        // Audit Log
        const swapId = crypto.randomUUID()
        await redis.lpush(`audit:swap:${userId}`, JSON.stringify({
            id: swapId,
            burned: swapAmount,
            received: receivedUSDC,
            timestamp: now
        }))

        return NextResponse.json({
            success: true,
            swapId,
            burned: swapAmount,
            receivedUSDC: receivedUSDC,
            newBalance: currentBalance - swapAmount
        })
    } catch (error: any) {
        console.error('Swap Error:', error)
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
    }
}
