import { redis } from '@/lib/redis'
import { BOAT_CONFIG, FISH_VALUES, DIFFICULTY_CONFIG, GLOBAL_CONFIG } from '@/lib/constants'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
    try {
        const { userId } = await req.json()
        if (!userId) return NextResponse.json({ error: 'Missing UserID' }, { status: 400 })

        // 1. Session & Mode Check (Strict)
        const sessionActive = await redis.exists(`auth:session:${userId}`)
        if (!sessionActive) return NextResponse.json({ error: 'UNAUTHORIZED_SESSION' }, { status: 401 })

        const userData: any = await redis.hgetall(`user:${userId}`)
        if (!userData || Object.keys(userData).length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        if (userData.mode !== "PAID_USER") {
            return NextResponse.json({ error: 'MINING_LOCK_FREE_MODE' }, { status: 403 })
        }

        // 2. Rate Limiting Check
        const lastCast = parseInt(userData.lastCastAt || "0")
        const now = Date.now()
        if (now - lastCast < GLOBAL_CONFIG.MIN_CAST_INTERVAL) {
            return NextResponse.json({ error: 'CAST_TOO_FAST' }, { status: 429 })
        }

        // 3. Global Difficulty Calculation (Atomic)
        const qualifiedCount = parseInt(await redis.get('stats:qualified_players') || "0")
        const difficultyMult = Math.max(
            DIFFICULTY_CONFIG.MIN_DIFFICULTY,
            DIFFICULTY_CONFIG.BASE_DIFFICULTY - (qualifiedCount * DIFFICULTY_CONFIG.PLAYER_REDUCTION)
        )

        const boatLevel = parseInt(userData.activeBoatLevel || "0") as keyof typeof BOAT_CONFIG
        const config = BOAT_CONFIG[boatLevel]
        if (!config) {
            return NextResponse.json({ error: 'INVALID_BOAT_CONFIG', boatLevel }, { status: 500 })
        }

        // 4. Caps Check (Hourly & Daily)
        const hourlyCatches = parseInt(userData.hourlyCatches || "0")
        if (hourlyCatches >= config.fishPerHour) {
            return NextResponse.json({ error: 'HOURLY_CAP_REACHED' }, { status: 429 })
        }

        const todayKey = `daily_cap:${userId}:${new Date().toISOString().split('T')[0]}`
        const dailyCatches = parseInt(await redis.get(todayKey) || "0")
        if (dailyCatches >= GLOBAL_CONFIG.DAILY_CATCH_CAP) {
            return NextResponse.json({ error: 'DAILY_CAP_REACHED' }, { status: 429 })
        }

        // 5. Probability Success Logic (Server-Side RNG)
        const roll = crypto.randomInt(0, 1000) / 1000
        const successRate = config.catchingRate * difficultyMult
        const isSuccess = roll < successRate

        // Update Last Cast immediately
        await redis.hset(`user:${userId}`, { lastCastAt: now.toString() })

        if (!isSuccess) {
            return NextResponse.json({ status: 'MISS', difficultyMult })
        }

        // 6. Bucket Action (Only on SUCCESS)
        const bucket = JSON.parse(userData.distributionBucket || "[]")
        const cursor = parseInt(userData.currentIndex || "0")

        if (cursor >= bucket.length || bucket.length === 0) {
            return NextResponse.json({ error: 'BUCKET_EXHAUSTED' }, { status: 410 })
        }

        const fishType = bucket[cursor]
        const fishValue = FISH_VALUES[fishType as keyof typeof FISH_VALUES] || 1

        // 7. Commit result (Atomic)
        const newMinedFish = parseFloat(userData.minedFish || "0") + fishValue
        const newXp = parseInt(userData.xp || "0") + 10

        const updateData: any = {
            minedFish: newMinedFish.toString(),
            xp: newXp.toString(),
            currentIndex: (cursor + 1).toString(),
            hourlyCatches: (hourlyCatches + 1).toString(),
            totalSuccessfulCasts: (parseInt(userData.totalSuccessfulCasts || "0") + 1).toString()
        }

        // Qualified Player Logic
        if (userData.isQualified !== "true") {
            updateData.isQualified = "true"
            await redis.incr('stats:qualified_players')
        }

        await redis.hset(`user:${userId}`, updateData)
        await redis.incr(todayKey)
        await redis.expire(todayKey, 86400 * 2) // Keep for 2 days

        // Global Economy Stats
        await redis.hincrbyfloat('stats:global', 'total_fish_minted', fishValue)

        // Audit Log
        const castId = crypto.randomUUID()
        await redis.lpush(`audit:mining:${userId}`, JSON.stringify({
            id: castId,
            type: fishType,
            value: fishValue,
            timestamp: now,
            success: true
        }))

        return NextResponse.json({
            status: 'SUCCESS',
            castId,
            fish: { type: fishType, value: fishValue },
            stats: {
                minedFish: newMinedFish,
                xp: newXp,
                hourlyCatches: hourlyCatches + 1,
                difficultyMult
            }
        })
    } catch (error: any) {
        console.error('Mining Cast Error:', error)
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
    }
}
