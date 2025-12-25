import { redis } from '@/lib/redis'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const { userId } = await req.json()
        if (!userId) return NextResponse.json({ error: 'Missing UserID' }, { status: 400 })

        const userData = await redis.hgetall(`user:${userId}`)
        if (!userData) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        const tickets = parseInt(userData.spinTickets || "0")
        if (tickets <= 0) return NextResponse.json({ error: 'No tickets' }, { status: 400 })

        // 1. Rigged Probability Server-Side
        const rand = Math.random() * 100
        let prize = 0

        if (rand < 60) { // 60% Try Again (Common)
            prize = 0
        } else {
            const winRand = Math.random() * 100
            if (winRand < 80) prize = 0.05 // Common win
            else if (winRand < 95) prize = 0.5 // Uncommon
            else if (winRand < 99) prize = 5 // Rare
            else prize = 50 // Legendary
        }

        // 2. Update Balance & Tickets
        const newTickets = tickets - 1
        // Spin rewards go to spinBalance as per spec
        const newSpinBalance = parseFloat(userData.spinBalance || "0") + prize

        await redis.hset(`user:${userId}`, {
            spinTickets: newTickets.toString(),
            spinBalance: newSpinBalance.toString(),
            lastSpinAt: Date.now().toString()
        })

        // Audit Log
        await redis.lpush(`audit:${userId}:spin`, JSON.stringify({
            prize,
            timestamp: Date.now()
        }))

        return NextResponse.json({
            success: true,
            prize,
            newTickets,
            newSpinBalance
        })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
