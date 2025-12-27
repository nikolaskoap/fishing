import { redis } from '@/lib/redis'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const totalPlayers = await redis.scard('players:all') || 0
        const totalCaughtRaw = await redis.get('stats:total_caught') || "0"
        const totalCaught = parseFloat(totalCaughtRaw as string)

        const baseDifficulty = 100
        const difficulty = Math.max(70, baseDifficulty - (totalPlayers * 0.1))

        return NextResponse.json({
            difficulty: difficulty.toFixed(1),
            totalCaught: totalCaught.toFixed(3),
            burnedFish: 0, // Placeholder for future burn logic
            totalPlayers: totalPlayers
        })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
