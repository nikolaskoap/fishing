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

        const userData = await redis.hgetall(`user:${userId}`)
        const currentBalance = parseFloat(userData.canFishBalance || "0")

        if (currentBalance < swapAmount) {
            return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
        }

        // Logic: 100 CanFish = 5 USDC, Fee 1 USDC
        const usdcValue = (swapAmount / SWAP_CONFIG.RATE) * SWAP_CONFIG.USDC_REWARD
        const receivedUSDC = usdcValue - SWAP_CONFIG.FEE

        const newBalance = currentBalance - swapAmount

        await redis.hset(`user:${userId}`, {
            canFishBalance: newBalance.toString()
        })

        // Log transaction
        await redis.lpush(`audit:${userId}:swap`, JSON.stringify({
            burned: swapAmount,
            received: receivedUSDC,
            timestamp: Date.now()
        }))

        return NextResponse.json({
            burned: swapAmount,
            receivedUSDC: receivedUSDC,
            newBalance: newBalance
        })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
