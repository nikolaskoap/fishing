import { redis } from '@/lib/redis'
import { BOAT_CONFIG, BoatTier, isDeveloper } from '@/lib/constants'
import { NextRequest, NextResponse } from 'next/server'

// Mapping numeric tiers from frontend to BoatTier strings
const TIER_MAP: Record<number, BoatTier> = {
    10: "SMALL",
    20: "MEDIUM",
    50: "LARGE"
}

export async function POST(req: NextRequest) {
    let fid: string | undefined;
    let tier: any;

    try {
        const body = await req.json()
        fid = body.userId // Frontend sends FID as userId
        tier = body.tier

        if (!fid || tier === undefined) {
            return NextResponse.json({ error: 'Missing FID or Tier' }, { status: 400 })
        }

        // 1. Session & Auth Check
        const sessionActive = await redis.exists(`auth:session:${fid}`)
        const dev = isDeveloper(fid)

        // Developer bypass skips only the session check
        if (!sessionActive && !dev) {
            return NextResponse.json({ error: 'UNAUTHORIZED_SESSION' }, { status: 401 })
        }

        // 2. Validate Boat Tier
        const boatTierKey = TIER_MAP[parseInt(tier)]
        if (!boatTierKey) {
            return NextResponse.json({ error: 'INVALID_BOAT_TIER' }, { status: 400 })
        }

        const config = BOAT_CONFIG[boatTierKey]

        // 3. User Data Preparation
        const userKey = `user:${fid}`
        const existingData: any = await redis.hgetall(userKey) || {}

        // Ensure wallet exists in schema (use walletAddress as fallback from old sessions)
        const wallet = existingData.wallet || existingData.walletAddress || "N/A"

        // 4. Redis Schema Implementation (Fully Initialized)
        const userData = {
            fid: fid.toString(),
            wallet: wallet,
            mode: "PAID_USER",
            boatTier: boatTierKey,
            catchingRate: config.catchingRate.toString(),
            qualified: "false",
            createdAt: existingData.createdAt || Date.now().toString()
        }

        // Perform atomic update
        await redis.hset(userKey, userData)

        // 5. Success Response
        return NextResponse.json({
            success: true,
            mode: "PAID_USER",
            boatTier: boatTierKey,
            catchingRate: config.catchingRate
        })

    } catch (error: any) {
        // 6. Structured Error Logging
        console.error("BOAT_SELECT_ERROR", {
            fid,
            tier,
            error: error?.message
        })

        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message
        }, { status: 500 })
    }
}
