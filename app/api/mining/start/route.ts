import { redis } from '@/lib/redis'
import { BOAT_CONFIG } from '@/lib/constants'
import { generateBucket } from '@/services/mining.service'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const { userId } = await req.json()
        if (!userId) return NextResponse.json({ error: 'Missing UserID/FID' }, { status: 400 })

        const userData: any = await redis.hgetall(`user:${userId}`)
        if (!userData) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        const boatLevel = parseInt(userData.activeBoatLevel || "0")
        if (boatLevel === 0) return NextResponse.json({ error: 'Select a boat first' }, { status: 400 })

        const config = BOAT_CONFIG[boatLevel as keyof typeof BOAT_CONFIG]

        // Initialize Session
        const sessionKey = `session:${userId}`
        const now = Date.now()

        // Generate Hourly Bucket if needed
        let bucket = userData.distributionBucket
        const hourStart = parseInt(userData.hourStart || "0")

        if (now - hourStart >= 3600000 || !bucket) {
            const newBucket = generateBucket(config.fishPerHour)
            bucket = JSON.stringify(newBucket)
            await redis.hset(`user:${userId}`, {
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
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
