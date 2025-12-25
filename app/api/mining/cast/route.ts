import { redis } from '@/lib/redis'
import { BOAT_CONFIG, FISH_VALUE } from '@/lib/constants'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const { userId } = await req.json()
        if (!userId) return NextResponse.json({ error: 'Missing UserID' }, { status: 400 })

        const userData = await redis.hgetall(`user:${userId}`)
        if (!userData) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        // 1. Session Check
        const sessionActive = await redis.exists(`session:${userId}`)
        if (!sessionActive) return NextResponse.json({ status: 'SESSION_EXPIRED' })

        // 2. Rate Limiting Check (Anti-Bot)
        const lastCast = parseInt(userData.lastCastAt || "0")
        const now = Date.now()
        if (now - lastCast < 4000) { // Min 4s between casts
            return NextResponse.json({ error: 'CAST_TOO_FAST' }, { status: 429 })
        }

        const boatLevel = parseInt(userData.activeBoatLevel || "0") as keyof typeof BOAT_CONFIG
        const config = BOAT_CONFIG[boatLevel]

        // 3. Hourly Cap Check
        const hourlyProgress = parseInt(userData.hourlyProgress || "0")
        if (hourlyProgress >= config.hourlyFishCap) {
            return NextResponse.json({ status: 'CAP_REACHED' })
        }

        // 4. Catching Rate Logic (SUCCESS/MISS)
        const success = Math.random() <= config.catchingRate

        if (!success) {
            await redis.hset(`user:${userId}`, { lastCastAt: now.toString() })
            return NextResponse.json({ status: 'MISS' })
        }

        // 5. pop from Bucket
        const bucket = JSON.parse(userData.distributionBucket || "[]")
        const index = parseInt(userData.currentIndex || "0")

        if (index >= bucket.length) return NextResponse.json({ status: 'CAP_REACHED' })

        const fishType = bucket[index]
        const fishValue = FISH_VALUE[fishType as keyof typeof FISH_VALUE] || 1

        // Update User State
        const newMinedFish = parseFloat(userData.minedFish || "0") + fishValue
        const newXp = parseInt(userData.xp || "0") + 10
        const newProgress = hourlyProgress + 1

        await redis.hset(`user:${userId}`, {
            minedFish: newMinedFish.toString(),
            xp: newXp.toString(),
            currentIndex: (index + 1).toString(),
            hourlyProgress: newProgress.toString(),
            lastCastAt: now.toString()
        })

        // Audit Log
        await redis.lpush(`audit:${userId}:mining`, JSON.stringify({
            type: fishType,
            value: fishValue,
            timestamp: now
        }))

        return NextResponse.json({
            status: 'SUCCESS',
            fish: {
                type: fishType,
                value: fishValue
            },
            hourlyProgress: {
                current: newProgress,
                max: config.hourlyFishCap
            }
        })
    } catch (error) {
        console.error('Cast Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
