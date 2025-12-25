import { redis } from '@/lib/redis'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const totalPlayers = await redis.scard('players:all') || 300 // fallback
        const baseDifficulty = 100
        const difficulty = Math.max(70, baseDifficulty - (totalPlayers * 0.1))

        return NextResponse.json({
            difficulty: difficulty.toFixed(1),
            fishSupply: 8900000,
            burnedFish: 124000,
            totalPlayers: totalPlayers
        })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
