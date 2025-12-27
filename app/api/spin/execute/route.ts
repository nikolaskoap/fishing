import { redis } from '@/lib/redis'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
    try {
        const { userId } = await req.json()
        if (!userId) return NextResponse.json({ error: 'Missing UserID' }, { status: 400 })

        // 1. Session Check
        const sessionActive = await redis.exists(`auth:session:${userId}`)
        if (!sessionActive) return NextResponse.json({ error: 'UNAUTHORIZED_SESSION' }, { status: 401 })

        const userKey = `user:${userId}`

        // 2. Ticket Burn (Atomic)
        const tickets = await redis.hincrby(userKey, 'spinTickets', -1)
        if (tickets < 0) {
            await redis.hincrby(userKey, 'spinTickets', 1) // Refund if failed
            return NextResponse.json({ error: 'NO_TICKETS' }, { status: 400 })
        }

        // 3. Secure RNG & Prize Calculation
        // Legendary: 100 USDC, Epic: 50, Rare: 25, Uncommon: 10, Common: small
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

        // 4. Commit Prize to SEPARATE balance
        if (prize > 0) {
            await redis.hincrbyfloat(userKey, 'spin_rewards_usdc', prize)
        }

        const spinId = crypto.randomUUID()
        const now = Date.now()

        // 5. Audit Log (Transparency)
        await redis.lpush(`audit:spin:${userId}`, JSON.stringify({
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
        console.error('Spin Error:', error)
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
    }
}
