import { redis } from '@/lib/redis'
import { BOAT_CONFIG, FISH_VALUES, DIFFICULTY_CONFIG, GLOBAL_CONFIG, BoatTier, isDeveloper } from '@/lib/constants'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { ensureUser } from '@/lib/ensureUser'

export async function POST(req: NextRequest) {
    let fid: string | undefined;
    try {
        const body = await req.json()
        fid = body.userId?.toString()
        const wallet = body.wallet

        if (!fid) return NextResponse.json({ error: 'Missing UserID' }, { status: 400 })

        // 1. Session & Mode Check (Strict)
        const sessionActive = await redis.exists(`auth:session:${fid}`)
        if (!sessionActive) return NextResponse.json({ error: 'UNAUTHORIZED_SESSION' }, { status: 401 })

        // 2. Ensure User Data exists using ensureUser
        const userData = await ensureUser(redis, fid, wallet)

        if (!userData) {
            return NextResponse.json({ error: 'USER_DATA_NOT_FOUND' }, { status: 500 })
        }

        const dev = isDeveloper(fid)

        console.log("WALLET_DEBUG", {
            dev,
            requestWallet: wallet,
            redisWallet: userData.wallet
        })

        // Wallet Binding Rule: If wallet provided, verify mismatch
        // Wallet Binding Rule: Handled by ensureUser


        if (userData.mode !== "PAID_USER") {
            return NextResponse.json({ error: 'MINING_LOCK_FREE_MODE' }, { status: 403 })
        }

        // 3. Rate Limiting Check
        const lastCast = Number(userData.lastCastAt ?? 0)
        const now = Date.now()
        if (now - lastCast < GLOBAL_CONFIG.MIN_CAST_INTERVAL) {
            return NextResponse.json({ error: 'CAST_TOO_FAST' }, { status: 429 })
        }

        // 4. Global Difficulty Calculation (Atomic)
        const qualifiedCount = Number(await redis.get('stats:qualified_players') ?? 0)
        const difficultyMult = Math.max(
            DIFFICULTY_CONFIG.MIN_DIFFICULTY,
            DIFFICULTY_CONFIG.BASE_DIFFICULTY - (qualifiedCount * DIFFICULTY_CONFIG.PLAYER_REDUCTION)
        )

        const boatTierMap: Record<number, BoatTier> = {
            10: "SMALL",
            20: "MEDIUM",
            50: "LARGE"
        }

        const numericBoatLevel = Number(userData.activeBoatLevel ?? 0)
        const boatTierKey = boatTierMap[numericBoatLevel]
        const config = boatTierKey ? BOAT_CONFIG[boatTierKey] : null

        if (!config) {
            return NextResponse.json({ error: 'INVALID_BOAT_CONFIG', boatLevel: numericBoatLevel }, { status: 500 })
        }

        // 5. Early Player Boost (Progressive Difficulty)
        const totalFish = Number(userData.minedFish || 0)
        let playerBoost = 1.0

        if (totalFish < 50) {
            // Beginner: +100% success rate (was 50%, now 100%)
            playerBoost = 2.0
        } else if (totalFish < 200) {
            // Intermediate: gradual decrease 2.0x → 1.0x
            const progress = (totalFish - 50) / 150
            playerBoost = 2.0 - (progress * 1.0)
        } else if (totalFish < 500) {
            // Advanced: normal difficulty
            playerBoost = 1.0
        } else if (totalFish < 1000) {
            // Veteran: gradual penalty 1.0x → 0.7x
            const progress = (totalFish - 500) / 500
            playerBoost = 1.0 - (progress * 0.3)
        } else {
            // Master: inflation control
            playerBoost = 0.7
        }

        // 6. Caps Check (Hourly & Daily)
        const hourlyCatches = Number(userData.hourlyCatches ?? 0)
        if (hourlyCatches >= config.fishPerHour) {
            return NextResponse.json({ error: 'HOURLY_CAP_REACHED' }, { status: 429 })
        }

        const todayKey = `daily_cap:${fid}:${new Date().toISOString().split('T')[0]}`
        const dailyCatches = Number(await redis.get(todayKey) ?? 0)
        if (dailyCatches >= GLOBAL_CONFIG.DAILY_CATCH_CAP) {
            return NextResponse.json({ error: 'DAILY_CAP_REACHED' }, { status: 429 })
        }

        // 7. Calculate Final Success Rate with Player Boost
        const roll = crypto.randomInt(0, 1000) / 1000
        const successRate = config.catchingRate * difficultyMult * playerBoost
        const isSuccess = roll < successRate

        // Update Last Cast immediately
        await redis.hset(`user:${fid}`, { lastCastAt: now.toString() })

        // Update XP even on MISS (effort reward)
        if (!isSuccess) {
            const missXp = Number(userData.xp ?? 0) + 2
            await redis.hset(`user:${fid}`, { xp: missXp.toString() })

            return NextResponse.json({
                status: 'MISS',
                difficultyMult,
                playerBoost,
                finalRate: successRate,
                stats: {
                    xp: missXp,
                    minedFish: Number(userData.minedFish ?? 0),
                    currentIndex: Number(userData.currentIndex ?? 0)
                }
            })
        }

        // 8. Bucket Action (Only on SUCCESS)
        const bucket = JSON.parse(String(userData.distributionBucket || "[]"))
        const cursor = Number(userData.currentIndex ?? 0)

        if (cursor >= bucket.length || bucket.length === 0) {
            return NextResponse.json({ error: 'BUCKET_EXHAUSTED' }, { status: 410 })
        }

        const fishType = bucket[cursor]
        const fishValue = FISH_VALUES[fishType as keyof typeof FISH_VALUES] || 1

        // 9. Calculate XP with Bonus
        const bonusXpMap: Record<string, number> = {
            'JUNK': 0,
            'COMMON': 1,
            'UNCOMMON': 2,
            'EPIC': 5,
            'LEGENDARY': 10
        }
        const bonusXp = bonusXpMap[fishType] || 0

        const newMinedFish = Number(userData.minedFish ?? 0) + fishValue
        const newXp = Number(userData.xp ?? 0) + 10 + bonusXp

        // 10. Check Level Up & Award Spin Tickets
        const oldLevel = Math.floor(Number(userData.xp || 0) / 500) + 1
        const newLevel = Math.floor(newXp / 500) + 1

        const updateData: any = {
            minedFish: newMinedFish.toString(),
            xp: newXp.toString(),
            currentIndex: (cursor + 1).toString(),
            hourlyCatches: (hourlyCatches + 1).toString(),
            totalSuccessfulCasts: (Number(userData.totalSuccessfulCasts ?? 0) + 1).toString()
        }

        // Award spin tickets for level ups (backend authoritative)
        if (newLevel > oldLevel) {
            const levelUps = newLevel - oldLevel
            const currentTickets = Number(userData.spinTickets || 0)
            updateData.spinTickets = (currentTickets + levelUps).toString()
        }

        // Qualified Player Logic
        if (userData.isQualified !== "true") {
            updateData.isQualified = "true"
            await redis.incr('stats:qualified_players')
        }

        // Referral Activation (claim-based rewards only)
        if (userData.referredBy && userData.referralActive !== 'true') {
            const isPaid = userData.isPaid === 'true'
            const minCasts = Number(updateData.totalSuccessfulCasts) >= 3

            if (isPaid && minCasts) {
                updateData.referralActive = 'true'
                // Increment referrer's active count
                await redis.hincrby(`user:${userData.referredBy}`, 'activeReferrals', 1)
            }
        }

        await redis.hset(`user:${fid}`, updateData)
        await redis.incr(todayKey)
        await redis.expire(todayKey, 86400 * 2) // Keep for 2 days

        // Global Economy Stats
        await redis.hincrbyfloat('stats:global', 'total_fish_minted', fishValue)

        // Audit Log
        const castId = crypto.randomUUID()
        await redis.lpush(`audit:mining:${fid}`, JSON.stringify({
            id: castId,
            type: fishType,
            value: fishValue,
            timestamp: now,
            success: true
        }))

        // NOTE: Referral rewards moved to claim-based system (/api/referral/claim)
        // Only activation flag is set here, rewards are claimed manually

        return NextResponse.json({
            status: 'SUCCESS',
            castId,
            fish: { type: fishType, value: fishValue },
            stats: {
                minedFish: newMinedFish,
                xp: newXp,
                level: newLevel,
                spinTickets: updateData.spinTickets || userData.spinTickets || '0',
                currentIndex: cursor + 1,
                hourlyCatches: hourlyCatches + 1,
                difficultyMult,
                playerBoost,
                finalRate: successRate
            }
        })
    } catch (error: any) {
        if (error.message === 'WALLET_MISMATCH') {
            return NextResponse.json({ error: 'UNAUTHORIZED_SESSION', detail: 'Wallet mismatch' }, { status: 401 })
        }
        console.error('API_ERROR', {
            route: '/api/mining/cast',
            fid,
            error: error.message
        })
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
