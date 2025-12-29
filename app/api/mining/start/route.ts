import { redis } from '@/lib/redis'
import { BOAT_CONFIG, BoatTier } from '@/lib/constants'
import { generateBucket } from '@/services/mining.service'
import { NextRequest, NextResponse } from 'next/server'
import { ensureUser } from '@/lib/ensureUser'

export async function POST(req: NextRequest) {
    let fid: string | undefined;
    try {
        const body = await req.json()
        fid = body.userId?.toString()

        if (!fid) return NextResponse.json({ error: 'Missing UserID/FID' }, { status: 400 })

        // 1. Ensure User Data exists using ensureUser
        const userData = await ensureUser(redis, fid)

        const boatLevel = parseInt(userData.activeBoatLevel || "0")
        if (boatLevel === 0) return NextResponse.json({ error: 'Select a boat first' }, { status: 400 })

        const boatTierMap: Record<number, BoatTier> = {
            10: "SMALL",
            20: "MEDIUM",
            50: "LARGE"
        }
        const boatTierKey = boatTierMap[boatLevel]
        const config = boatTierKey ? BOAT_CONFIG[boatTierKey] : null

        if (!config) return NextResponse.json({ error: 'INVALID_BOAT_CONFIG' }, { status: 500 })

        // Initialize Session
        const sessionKey = `session:${fid}`
        const now = Date.now()

        // Generate Hourly Bucket if needed
        let bucket = userData.distributionBucket
        const hourStart = parseInt(userData.hourStart || "0")

        if (now - hourStart >= 3600000 || !bucket) {
            const newBucket = generateBucket(config.fishPerHour)
            bucket = JSON.stringify(newBucket)
            await redis.hset(`user:${fid}`, {
                distributionBucket: bucket,
                currentIndex: "0",
                hourStart: now.toString(),
                hourlyProgress: "0"
            })
        }

        await redis.setex(sessionKey, 1800, "active") // 30 min session expiry

        return NextResponse.json({
            sessionActive: true,
            fishCapPerHour: config.fishPerHour
        })
    } catch (error: any) {
        console.error('API_ERROR', {
            route: '/api/mining/start',
            fid,
            error: error.message
        })
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
