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
                mode: dev ? "PAID_USER" : "FREE_USER",
                isQualified: false
            })
        }

        // Backend Driven: Check if hour has passed to refresh bucket
        // ONLY if user is PAID_USER
        const mode = userData.mode || "FREE_USER"
        const now = Date.now()
        const hourStart = parseInt(userData.hourStart || "0")
        const boatLevel = parseInt(userData.activeBoatLevel || "0")
        const config = BOAT_CONFIG[boatLevel as keyof typeof BOAT_CONFIG]

        if (mode === "PAID_USER" && boatLevel > 0) {
            if (config && (now - hourStart >= 3600000 || !userData.distributionBucket)) {
                const newBucket = generateBucket(config.fishPerHour)
                userData.distributionBucket = JSON.stringify(newBucket)
                userData.currentIndex = "0"
                userData.hourStart = now.toString()
                userData.hourlyProgress = "0"

                await redis.hset(`user:${fid}`, {
                    distributionBucket: userData.distributionBucket,
                    currentIndex: "0",
                    hourStart: userData.hourStart,
                    hourlyProgress: "0"
                })
            }
        }

        return NextResponse.json({
            ...userData,
            invitees: invitees || [],
            socialVerified: userData.socialVerified === "true",
            isQualified: userData.isQualified === "true"
        })
    } catch (error: any) {
        console.error('User GET Error:', error)
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { fid, walletAddress, referrerFid } = body

        if (!fid) {
            return NextResponse.json({ error: 'Missing FID' }, { status: 400 })
        }

        // Session Check
        const sessionActive = await redis.exists(`auth:session:${fid}`)
        if (!sessionActive && !isDeveloper(fid)) {
            return NextResponse.json({ error: 'UNAUTHORIZED_SESSION' }, { status: 401 })
        }

        // Referral Logic Integration (Only for new users)
        if (referrerFid && referrerFid !== fid) {
            const alreadyExists = await redis.exists(`user:${fid}`)
            const alreadyReferred = await redis.get(`user:${fid}:referred_by`)

            if (!alreadyExists && !alreadyReferred) {
                await redis.set(`user:${fid}:referred_by`, referrerFid)
                await redis.hincrby(`user:${referrerFid}`, 'referralCount', 1)
                await redis.sadd(`user:${referrerFid}:invitees`, fid)
            }
        }

        // ONLY allow non-gameplay critical fields to be updated via this route
        const dataToSave: any = {
            lastSeen: Date.now().toString()
        }
        if (walletAddress !== undefined) dataToSave.wallet = walletAddress

        await redis.hset(`user:${fid}`, dataToSave)

        return NextResponse.json({ success: true, note: "Gameplay fields locked on this endpoint" })
    } catch (error: any) {
        console.error('User POST Error:', error)
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
    }
}
