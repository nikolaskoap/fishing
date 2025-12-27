import { redis } from '@/lib/redis'
import { NextResponse } from 'next/server'
import { DIFFICULTY_CONFIG } from '@/lib/constants'

export async function GET() {
    try {
        const stats: any = await redis.hgetall('stats:global') || {}
        const qualifiedCount = parseInt(await redis.get('stats:qualified_players') || "0")
        const totalPlayers = await redis.scard('players:all')

        const difficulty = Math.max(
            DIFFICULTY_CONFIG.MIN_DIFFICULTY,
            DIFFICULTY_CONFIG.BASE_DIFFICULTY - (qualifiedCount * DIFFICULTY_CONFIG.PLAYER_REDUCTION)
        )

        return NextResponse.json({
            difficulty: (difficulty * 100).toFixed(1), // Display as percentage
            qualifiedPlayers: qualifiedCount,
            totalPlayers,
            totalFishMinted: parseFloat(stats.total_fish_minted || "0").toFixed(3),
            totalFishBurned: parseFloat(stats.total_fish_burned || "0").toFixed(3),
            usdcOutflow: (
                parseFloat(stats.total_usdc_swap_outflow || "0") +
                parseFloat(stats.total_spin_outflow || "0") +
                parseFloat(stats.total_referral_outflow || "0")
            ).toFixed(2),
            timestamp: Date.now()
        })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
