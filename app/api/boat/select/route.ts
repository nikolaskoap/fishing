import { redis } from '@/lib/redis'
import { BOAT_CONFIG, BoatTier, isDeveloper } from '@/lib/constants'
import { NextRequest, NextResponse } from 'next/server'
import { ensureUser } from '@/lib/ensureUser'

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
        fid = body.userId?.toString() // Frontend sends FID as userId
        tier = body.tier
        const wallet = body.wallet // Check if frontend sends wallet

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

        // 2. Ensure User Data exists using ensureUser
        const userData = await ensureUser(redis, fid, wallet)

        // Wallet Binding Rule: If wallet provided, verify mismatch
        if (wallet && userData.wallet !== "N/A" && userData.wallet !== wallet) {
            return NextResponse.json({ error: 'UNAUTHORIZED_SESSION', detail: 'Wallet mismatch' }, { status: 401 })
        }

        // 3. Validate Boat Tier
        const boatTierKey = TIER_MAP[parseInt(tier)]
        if (!boatTierKey) {
            return NextResponse.json({ error: 'INVALID_BOAT_TIER' }, { status: 400 })
        }

        const config = BOAT_CONFIG[boatTierKey]

        // 4. Update User Data (Only mode and boat info)
        const updateData = {
            mode: "PAID_USER",
            boatTier: boatTierKey,
            catchingRate: config.catchingRate.toString()
        }

        await redis.hset(`user:${fid}`, updateData)

        // 5. Success Response
        return NextResponse.json({
            success: true,
            mode: "PAID_USER",
            boatTier: boatTierKey,
            catchingRate: config.catchingRate
        })

    } catch (error: any) {
        // 6. Structured Error Logging
        console.error("API_ERROR", {
            route: '/api/boat/select',
            fid,
            error: error?.message
        })

        return NextResponse.json({
            error: 'Internal Server Error'
        }, { status: 500 })
    }
}
