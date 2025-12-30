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
            console.log("BOAT_SELECT_REQ_INVALID", { fid, tier })
            return NextResponse.json({ error: 'Missing FID or Tier' }, { status: 400 })
        }

        console.log("BOAT_SELECT_REQ", { fid, tier, wallet })

        // 1. Ensure User Data exists using ensureUser (MUST BE FIRST)
        const userData = await ensureUser(redis, fid, wallet)

        if (!userData) {
            return NextResponse.json({ error: 'USER_DATA_MISSING' }, { status: 500 })
        }

        // 2. Race Condition Protection (Lock)
        const lockKey = `lock:boat:${fid}`
        const locked = await redis.set(lockKey, '1', { nx: true, ex: 5 })
        if (!locked) {
            return NextResponse.json({ error: 'REQUEST_IN_PROGRESS' }, { status: 429 })
        }

        try {
            // 3. Section & Auth Check
            const sessionActive = await redis.exists(`auth:session:${fid}`)
            const dev = isDeveloper(fid)

            if (!sessionActive && !dev) {
                return NextResponse.json({ error: 'UNAUTHORIZED_SESSION' }, { status: 401 })
            }

            // 4. Wallet Binding Rule
            // Only error if user already has a valid wallet set and it mismatches
            // "N/A" or empty string counts as unset/valid to update (though update happens in auth/verify usually)
            if (
                !dev &&
                wallet &&
                userData.wallet &&
                userData.wallet !== "N/A" &&
                userData.wallet !== "" &&
                userData.wallet !== wallet
            ) {
                return NextResponse.json({ error: 'UNAUTHORIZED_SESSION', detail: 'Wallet mismatch' }, { status: 401 })
            }

            const tierNum = parseInt(tier)
            if (isNaN(tierNum)) {
                return NextResponse.json({ error: 'INVALID_TIER_VALUE' }, { status: 400 })
            }

            // 5. Handle FREE MODE (Tier 0)
            if (tierNum === 0) {
                // Anti-Downgrade Rule: Cannot switch to Free if already Paid
                if (userData.mode === "PAID_USER") {
                    return NextResponse.json({ error: 'CANNOT_DOWNGRADE_MODE' }, { status: 400 })
                }

                await redis.hset(`user:${fid}`, {
                    mode: "FREE_USER"
                })

                console.log("BOAT_SELECT_SUCCESS", {
                    fid,
                    mode: "FREE_USER",
                    tier: 0
                })

                return NextResponse.json({
                    success: true,
                    mode: "FREE_USER",
                    boatTier: "SMALL", // Default for free
                    catchingRate: 0,
                    canMine: false
                })
            }

            // 6. Handle PAID MODE
            const boatTierKey = TIER_MAP[tierNum]
            if (!boatTierKey) {
                return NextResponse.json({ error: 'INVALID_BOAT_TIER' }, { status: 400 })
            }

            // Check if already on this tier
            if (userData.mode === "PAID_USER" && userData.boatTier === boatTierKey) {
                return NextResponse.json({ error: 'ALREADY_USING_THIS_TIER' }, { status: 400 })
            }

            const config = BOAT_CONFIG[boatTierKey]
            if (!config) {
                return NextResponse.json({ error: 'BOAT_CONFIG_MISSING' }, { status: 500 })
            }

            // Update User Data
            await redis.hset(`user:${fid}`, {
                mode: "PAID_USER",
                boatTier: boatTierKey,
                catchingRate: config.catchingRate // Store as number
            })

            console.log("BOAT_SELECT_SUCCESS", {
                fid,
                mode: "PAID_USER",
                tier: tierNum
            })

            // Success Response
            return NextResponse.json({
                success: true,
                mode: "PAID_USER",
                boatTier: boatTierKey,
                catchingRate: config.catchingRate,
                canMine: true
            })
        } finally {
            await redis.del(lockKey)
        }

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
