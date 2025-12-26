import { redis } from '@/lib/redis'
import { BOAT_CONFIG } from '@/lib/constants'
import { NextRequest, NextResponse } from 'next/server'
import { BoatTier } from '../../../../types/backend'

export async function POST(req: NextRequest) {
    try {
        const { userId, tier } = await req.json()
        const selectedTier = (tier === 'FREE' ? 0 : parseInt(tier)) as BoatTier

        if (!userId || isNaN(selectedTier)) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

        const userData: any = await redis.hgetall(`user:${userId}`)
        if (!userData) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        if (userData.socialVerified !== "true") {
            return NextResponse.json({ error: 'Social gate locked' }, { status: 403 })
        }

        const currentTier = parseInt(userData.activeBoatLevel || "0")

        // Rules: No downgrade, upgrade only
        if (selectedTier < currentTier && selectedTier !== 0) {
            return NextResponse.json({ error: 'Downgrade not allowed' }, { status: 400 })
        }

        const config = BOAT_CONFIG[selectedTier]
        await redis.hset(`user:${userId}`, {
            activeBoatLevel: selectedTier.toString(),
            mode: selectedTier === 0 ? "FREE" : "PAID",
            fishCapPerHour: config.fishPerHour.toString()
        })

        return NextResponse.json({
            activeTier: selectedTier === 0 ? "FREE" : selectedTier,
            catchingRate: `${(config.catchingRate * 100).toFixed(0)}%`
        })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
