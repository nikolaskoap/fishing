import { redis } from '@/lib/redis'
import { isDeveloper } from '@/lib/constants'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { ensureUser } from '@/lib/ensureUser'

export async function POST(req: NextRequest) {
    let fid: string | undefined;
    try {
        const body = await req.json()
        fid = body.userId?.toString()
        const wallet = body.wallet

        if (!fid) return NextResponse.json({ error: 'Missing UserID' }, { status: 400 })

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

        // 3. Ticket Burn (Atomic)
        const tickets = await redis.hincrby(userKey, 'spinTickets', -1)
        if (tickets < 0) {
            await redis.hincrby(userKey, 'spinTickets', 1) // Refund if failed
            return NextResponse.json({ error: 'NO_TICKETS' }, { status: 400 })
        }

        // 4. Secure RNG & Prize Calculation
        const roll = crypto.randomInt(0, 10000)
        let prize = 0
        let rarity = 'TRY_AGAIN'

        if (roll < 1) { // 0.01%
            prize = 100
            rarity = 'LEGENDARY'
        } else if (roll < 10) { // 0.09%
            prize = 50
            rarity = 'EPIC'
        } else if (roll < 50) { // 0.4%
            prize = 25
            rarity = 'RARE'
        } else if (roll < 200) { // 1.5%
            prize = 10
            rarity = 'UNCOMMON'
        } else if (roll < 1000) { // 8%
            prize = 0.5 // Common USDC win
            rarity = 'COMMON'
        }

        // 5. Commit Prize to SEPARATE balance
        if (prize > 0) {
            await redis.hincrbyfloat(userKey, 'spin_rewards_usdc', prize)
        }

        const spinId = crypto.randomUUID()
        const now = Date.now()

        // 6. Audit Log (Transparency)
        await redis.lpush(`audit:spin:${fid}`, JSON.stringify({
            id: spinId,
            rarity,
            prize,
            timestamp: now
        }))

        // Global Economy Tracking
        if (prize > 0) {
            await redis.hincrbyfloat('stats:global', 'total_spin_outflow', prize)
        }

        return NextResponse.json({
            success: true,
            spinId,
            rarity,
            prize,
            newTickets: tickets,
            balance: prize > 0 ? (await redis.hget(userKey, 'spin_rewards_usdc')) : null
        })
    } catch (error: any) {
        if (error.message === 'WALLET_MISMATCH') {
            return NextResponse.json({ error: 'UNAUTHORIZED_SESSION', detail: 'Wallet mismatch' }, { status: 401 })
        }
        console.error('API_ERROR', {
            route: '/api/spin/execute',
            fid,
            error: error.message
        })
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
