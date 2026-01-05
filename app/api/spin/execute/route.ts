import { redis } from '@/lib/redis'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { ensureUser } from '@/lib/ensureUser'

export async function POST(req: NextRequest) {
    let fid: string | undefined;
    try {
        const body = await req.json()
        fid = body.fid?.toString() || body.userId?.toString()
        const wallet = body.wallet

        if (!fid) return NextResponse.json({ error: 'Missing UserID' }, { status: 400 })

        // 1. Session Check (Fast)
        const sessionActive = await redis.exists(`auth:session:${fid}`)
        if (!sessionActive) return NextResponse.json({ error: 'UNAUTHORIZED_SESSION' }, { status: 401 })

        // 2. Ensure User Data exists
        const userData = await ensureUser(redis, fid, wallet)
        if (!userData) {
            return NextResponse.json({ error: 'USER_DATA_NOT_FOUND' }, { status: 500 })
        }

        const userKey = `user:${fid}`

        // 3. Check Tickets First (Fix: Check BEFORE decrement)
        const currentTickets = Number(userData.spinTickets || 0)
        if (currentTickets <= 0) {
            return NextResponse.json({ error: 'NO_TICKETS' }, { status: 400 })
        }

        // 4. Ticket Burn (Atomic - only after validation)
        const tickets = await redis.hincrby(userKey, 'spinTickets', -1)

        // 5. Weighted RNG (99% 1 Fish Rule)
        const roll = crypto.randomInt(0, 10000) // 0 - 9999
        let prize = 0
        let rarity = 'COMMON'

        // 99% Chance for 1 Fish (0 - 9899)
        if (roll < 9900) {
            prize = 1
            rarity = 'COMMON'
        }
        // Remaining 1% distributed (9900 - 9999)
        else if (roll < 9950) { // 0.5%
            prize = 3
            rarity = 'RARE'
        } else if (roll < 9990) { // 0.4%
            prize = 5
            rarity = 'EPIC'
        } else { // 0.1% (9990 - 9999)
            prize = 10
            rarity = 'LEGENDARY'
        }

        // 6. Update Redis (Fish Balance)
        if (prize > 0) {
            await redis.hincrbyfloat(userKey, 'minedFish', prize)
        }

        const spinId = crypto.randomUUID()
        const now = Date.now()

        // 7. Audit Log
        await redis.lpush(`audit:spin:${fid}`, JSON.stringify({
            id: spinId,
            rarity,
            prize,
            timestamp: now
        }))

        // Get updated balance safely
        const newBalanceRaw = await redis.hget(userKey, 'minedFish')
        const newBalance = Number(newBalanceRaw ?? 0)

        return NextResponse.json({
            success: true,
            spinId,
            rarity,
            prize,
            newTickets: tickets,
            balance: newBalance
        })

    } catch (error: any) {
        if (error.message === 'WALLET_MISMATCH') {
            return NextResponse.json({ error: 'UNAUTHORIZED_SESSION', detail: 'Wallet mismatch' }, { status: 401 })
        }
        console.error('API_ERROR /api/spin/execute', {
            fid,
            error: error.message
        })
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
