import { redis } from '@/lib/redis'
import { NextRequest, NextResponse } from 'next/server'
import { BOAT_CONFIG, FISH_VALUE } from '@/services/mining.service'
import { FishRarity } from '@/components/Fishing/MiningController'

export async function POST(req: NextRequest) {
    try {
        const { fid } = await req.json()

        if (!fid) {
            return NextResponse.json({ error: 'Missing FID' }, { status: 400 })
        }

        const userData: any = await redis.hgetall(`user:${fid}`)
        if (!userData) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // 1. Session & Time Validation
        const now = Date.now()
        const boatLevel = parseInt(userData.activeBoatLevel || "0")
        const config = BOAT_CONFIG[boatLevel]

        if (boatLevel === 0) {
            return NextResponse.json({ error: 'Mining locked in Free Mode' }, { status: 403 })
        }

        const lastCast = parseInt(userData.lastCastTimestamp || "0")
        const boosterExpiry = parseInt(userData.boosterExpiry || "0")

        let interval = config.baseCastInterval * 1000 // Convert to ms
        if (now < boosterExpiry) {
            interval = interval * 0.95 // 5% speed boost as requested (or whatever logic defined)
            // Note: requested was +5% mining speed, which means 5% less interval.
        }

        // Tolerance of 100ms for network jitter
        if (now - lastCast < interval - 100) {
            return NextResponse.json({ error: 'CAST_TOO_FAST', nextAllowed: lastCast + interval }, { status: 429 })
        }

        // 2. Bucket Logic
        let bucket: FishRarity[] = []
        try {
            bucket = JSON.parse(userData.distributionBucket || "[]")
        } catch (e) { bucket = [] }

        let index = parseInt(userData.currentIndex || "0")

        if (index >= bucket.length) {
            return NextResponse.json({
                status: "NO_FISH",
                message: "Hourly cap reached. Wait for next hour."
            })
        }

        // Pop fish from index
        const fishType = bucket[index] as FishRarity
        const fishValue = FISH_VALUE[fishType] || 1

        // 3. Update State
        const newMinedFish = parseFloat(userData.minedFish || "0") + fishValue
        const newCanFish = parseFloat(userData.canFishBalance || "0") + fishValue
        const newXp = parseInt(userData.xp || "0") + 25 // 25 XP per catch

        await redis.hset(`user:${fid}`, {
            minedFish: newMinedFish.toString(),
            canFishBalance: newCanFish.toString(),
            xp: newXp.toString(),
            currentIndex: (index + 1).toString(),
            lastCastTimestamp: now.toString(),
            lastSeen: now.toString()
        })

        return NextResponse.json({
            status: "SUCCESS",
            fishType,
            fishValue,
            minedFish: newMinedFish,
            xp: newXp,
            currentIndex: index + 1,
            totalInBucket: bucket.length
        })

    } catch (error) {
        console.error('Mining Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
