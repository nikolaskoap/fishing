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

        // 0. DEBUG LOG (User Request)
        console.log("DEBUG_BOAT_SELECT", {
            fid,
            wallet,
            boatId: tier,
            timestamp: Date.now()
        })

        // 1. Ensure User Data exists using ensureUser (MUST BE FIRST)
        const userData = await ensureUser(redis, fid, wallet)

        // 2. Session & Auth Check
        // We do this AFTER ensureUser so we have valid user object to log/debug if needed
        const sessionActive = await redis.exists(`auth:session:${fid}`)
        const dev = isDeveloper(fid)

        if (!sessionActive && !dev) {
            return NextResponse.json({ error: 'UNAUTHORIZED_SESSION' }, { status: 401 })
        }

        // 3. Wallet Binding Rule: If wallet provided, verify mismatch
        if (wallet && userData.wallet !== "N/A" && userData.wallet !== wallet) {
            return NextResponse.json({ error: 'UNAUTHORIZED_SESSION', detail: 'Wallet mismatch' }, { status: 401 })
        }

        // 4. Validate Boat Tier
        const boatTierKey = TIER_MAP[parseInt(tier)]
        if (parseInt(tier) !== 0 && !boatTierKey) {
            // Allow tier 0 (Free Mode) or valid tier
            // If not 0 and not in map, error
            return NextResponse.json({ error: 'INVALID_BOAT_TIER' }, { status: 400 })
        }

        // Handle Free Mode (Tier 0) explicitly if needed, or just let it pass if no config needed
        // The original code assumed boatTierKey exists for the update. 
        // If tier is 0, we might strictly set mode to FREE_USER.

        let updateData: any = {};
        let config: any = null;

        if (parseInt(tier) === 0) {
            updateData = {
                mode: "FREE_USER",
                boatTier: "SMALL", // Default fallback or keep existing? 
                // Context: User might switch back to free mode? 
                // For now, let's assume switching to free mode just updates mode
            }
        } else {
            config = BOAT_CONFIG[boatTierKey]
            updateData = {
                mode: "PAID_USER",
                boatTier: boatTierKey,
                catchingRate: config.catchingRate.toString()
            }
        }

        if (config || parseInt(tier) === 0) {
            await redis.hset(`user:${fid}`, updateData)
        }

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
