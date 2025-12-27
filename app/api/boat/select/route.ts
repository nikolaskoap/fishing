import { redis } from '@/lib/redis'
import { BOAT_CONFIG } from '@/lib/constants'
import { NextRequest, NextResponse } from 'next/server'
// type BoatTier is defined locally to avoid build errors
type BoatTier = 0 | 10 | 20 | 50;


import { isDeveloper } from '@/lib/constants'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { userId, tier } = body

        if (!userId) {
            return NextResponse.json({ error: 'Missing UserID' }, { status: 400 })
        }

        // 1. Session Check (Skip if dev and new user, but generally required)
        const sessionActive = await redis.exists(`auth:session:${userId}`)
        const dev = isDeveloper(userId)
        if (!sessionActive && !dev) {
            return NextResponse.json({ error: 'UNAUTHORIZED_SESSION' }, { status: 401 })
        }

        const selectedTier = (tier === 'FREE' ? 0 : parseInt(tier)) as BoatTier
        if (isNaN(selectedTier)) {
            return NextResponse.json({ error: 'Invalid boat tier' }, { status: 400 })
        }

        let userData: any = await redis.hgetall(`user:${userId}`)

        // Initialize user if missing (especially for Devs)
        if (!userData || Object.keys(userData).length === 0) {
            if (dev) {
                const initial = {
                    id: userId,
                    fid: userId,
                    socialVerified: "true",
                    activeBoatLevel: "0",
                    mode: "FREE_USER",
                    minedFish: "0",
                    canFishBalance: "0",
                    isQualified: "false"
                }
                await redis.hset(`user:${userId}`, initial)
                userData = initial
            } else {
                return NextResponse.json({ error: 'User not found' }, { status: 404 })
            }
        }

        // 3. Rules: No downgrade (except for Devs)
        const currentTier = parseInt(userData.activeBoatLevel || "0")
        if (!dev && selectedTier < currentTier && selectedTier !== 0) {
            return NextResponse.json({ error: 'Downgrade not allowed' }, { status: 400 })
        }

        const config = BOAT_CONFIG[selectedTier as keyof typeof BOAT_CONFIG]
        if (!config) {
            return NextResponse.json({ error: 'Invalid boat tier config' }, { status: 400 })
        }

        // 4. Update Mode & Boat
        const newMode = selectedTier === 0 ? "FREE_USER" : "PAID_USER"

        await redis.hset(`user:${userId}`, {
            activeBoatLevel: selectedTier.toString(),
            mode: newMode,
            socialVerified: "true"
        })

        return NextResponse.json({
            success: true,
            mode: newMode,
            activeTier: selectedTier === 0 ? "FREE" : selectedTier,
            catchingRate: `${(config.catchingRate * 100).toFixed(0)}%`
        })
    } catch (error: any) {
        console.error('Boat Selection API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
    }
}
