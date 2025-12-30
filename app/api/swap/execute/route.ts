import { redis } from '@/lib/redis'
import { SWAP_CONFIG, isDeveloper } from '@/lib/constants'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { ensureUser } from '@/lib/ensureUser'

export async function POST(req: NextRequest) {
    let fid: string | undefined;
    try {
        const body = await req.json()
        fid = body.userId?.toString()
        const amount = body.amount
        const wallet = body.wallet
        const swapAmount = parseInt(amount)

        if (!fid || isNaN(swapAmount) || swapAmount < SWAP_CONFIG.MIN_SWAP) {
            return NextResponse.json({ error: 'Invalid swap amount' }, { status: 400 })
        }

        // 1. Session Check
        const sessionActive = await redis.exists(`auth:session:${fid}`)
        if (!sessionActive) return NextResponse.json({ error: 'UNAUTHORIZED_SESSION' }, { status: 401 })

        // 2. Ensure User Data exists using ensureUser
        const userData = await ensureUser(redis, fid, wallet)

        if (!userData) {
            return NextResponse.json({ error: 'USER_DATA_NOT_FOUND' }, { status: 500 })
        }

        // Wallet Binding Rule: If wallet provided, verify mismatch
        // Wallet Binding Rule: Handled by ensureUser


        const userKey = `user:${fid}`

        // 3. Cooldown Check (24h)
        const lastSwap = Number(userData.lastSwapAt ?? 0)
        const now = Date.now()
        if (now - lastSwap < 86400000) {
            return NextResponse.json({ error: 'SWAP_COOLDOWN_ACTIVE' }, { status: 429 })
        }

        // 4. Balance Re-check
        const currentBalance = Number(userData.canFishBalance ?? 0)
        if (currentBalance < swapAmount) {
            return NextResponse.json({ error: 'INSUFFICIENT_BALANCE' }, { status: 400 })
        }

        // 5. Logic Calculation
        const usdcValue = (swapAmount / SWAP_CONFIG.RATE) * SWAP_CONFIG.USDC_REWARD
        const receivedUSDC = usdcValue - SWAP_CONFIG.FEE

        // Update Balance
        await redis.hincrbyfloat(userKey, 'canFishBalance', -swapAmount)
        await redis.hset(userKey, { lastSwapAt: now.toString() })

        // 6. Global Economy Tracking
        await redis.hincrbyfloat('stats:global', 'total_fish_burned', swapAmount)
        await redis.hincrbyfloat('stats:global', 'total_usdc_swap_outflow', receivedUSDC)

        // Audit Log
        const swapId = crypto.randomUUID()
        await redis.lpush(`audit:swap:${fid}`, JSON.stringify({
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
        if (error.message === 'WALLET_MISMATCH') {
            return NextResponse.json({ error: 'UNAUTHORIZED_SESSION', detail: 'Wallet mismatch' }, { status: 401 })
        }
        console.error('API_ERROR', {
            route: '/api/swap/execute',
            fid,
            error: error.message
        })
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
