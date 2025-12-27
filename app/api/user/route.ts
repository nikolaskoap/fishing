import { redis } from '@/lib/redis'
import { NextRequest, NextResponse } from 'next/server'
import { generateBucket, BOAT_CONFIG } from '@/services/mining.service'
import { isDeveloper } from '@/lib/constants'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const fid = searchParams.get('fid')

    if (!fid) {
        return NextResponse.json({ error: 'Missing FID' }, { status: 400 })
    }

    try {
        let userData: any = await redis.hgetall(`user:${fid}`)
        const invitees = await redis.smembers(`user:${fid}:invitees`)

        if (!userData) {
            const dev = isDeveloper(fid)
            return NextResponse.json({
                minedFish: 0,
                rodLevel: 1,
                lastSeen: Date.now(),
                spinTickets: 1,
                lastDailySpin: 0,
                referralCount: 0,
                invitees: [],
                activeBoatLevel: dev ? 50 : 0,
                boosterExpiry: 0,
                canFishBalance: 0,
                socialVerified: dev,
                mode: dev ? "PAID" : "null"
            })
        }

        // Backend Driven: Check if hour has passed to refresh bucket
        const now = Date.now()
        const hourStart = parseInt(userData.hourStart || "0")
        const boatLevel = parseInt(userData.activeBoatLevel || "0")
        const config = BOAT_CONFIG[boatLevel as keyof typeof BOAT_CONFIG]

        if (now - hourStart >= 3600000 && boatLevel > 0) {
            const newBucket = generateBucket(config.fishPerHour)
            userData.distributionBucket = JSON.stringify(newBucket)
            userData.currentIndex = "0"
            userData.hourStart = now.toString()
            userData.fishEarnedThisHour = "0"

            // Persist the new bucket immediately
            await redis.hset(`user:${fid}`, {
                distributionBucket: userData.distributionBucket,
                currentIndex: "0",
                hourStart: userData.hourStart,
                fishEarnedThisHour: "0"
            })
        }

        return NextResponse.json({
            ...userData,
            invitees: invitees || []
        })
    } catch (error) {
        console.error('Redis Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { fid, minedFish, canFishBalance, rodLevel, activeBoatLevel, boosterExpiry, walletAddress, xp, spinTickets, lastDailySpin, referralCount, referrerFid } = body

        if (!fid) {
            return NextResponse.json({ error: 'Missing FID' }, { status: 400 })
        }

        // Referral Logic Integration
        if (referrerFid && referrerFid !== fid) {
            const alreadyExists = await redis.exists(`user:${fid}`)
            const alreadyReferred = await redis.get(`user:${fid}:referred_by`)

            if (!alreadyExists && !alreadyReferred) {
                await redis.set(`user:${fid}:referred_by`, referrerFid)
                await redis.hincrby(`user:${referrerFid}`, 'referralCount', 1)
                await redis.sadd(`user:${referrerFid}:invitees`, fid)
            }
        }

        // Save to Redis (Limited fields allowed via POST from frontend)
        const dataToSave: any = {
            lastSeen: Date.now()
        }
        if (minedFish !== undefined) dataToSave.minedFish = minedFish.toString()
        if (canFishBalance !== undefined) dataToSave.canFishBalance = canFishBalance.toString()
        if (rodLevel !== undefined) dataToSave.rodLevel = rodLevel.toString()
        if (xp !== undefined) dataToSave.xp = xp.toString()
        if (activeBoatLevel !== undefined) dataToSave.activeBoatLevel = activeBoatLevel.toString()
        if (boosterExpiry !== undefined) dataToSave.boosterExpiry = boosterExpiry.toString()
        if (spinTickets !== undefined) dataToSave.spinTickets = spinTickets.toString()
        if (lastDailySpin !== undefined) dataToSave.lastDailySpin = lastDailySpin.toString()
        if (referralCount !== undefined) dataToSave.referralCount = referralCount.toString()
        if (walletAddress !== undefined) dataToSave.wallet = walletAddress

        await redis.hset(`user:${fid}`, dataToSave)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Redis Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
