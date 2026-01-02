import { redis } from '@/lib/redis'
import { NextRequest, NextResponse } from 'next/server'
import { generateBucket, BOAT_CONFIG } from '@/services/mining.service'
import { isDeveloper, BoatTier } from '@/lib/constants'
import { ensureUser } from '@/lib/ensureUser'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const fid = searchParams.get('fid')

    if (!fid) {
        return NextResponse.json({ error: 'Missing FID' }, { status: 400 })
    }

    try {
        const userData = await ensureUser(redis, fid)
        if (!userData) {
            return NextResponse.json({ error: 'USER_DATA_NOT_FOUND' }, { status: 404 })
        }
        const invitees = await redis.smembers(`user:${fid}:invitees`)

        // Backend Driven: Check if hour has passed to refresh bucket
        // ONLY if user is PAID_USER
        const mode = userData.mode || "FREE_USER"
        const now = Date.now()
        const hourStart = Number(userData.hourStart ?? 0)
        const boatLevel = Number(userData.activeBoatLevel ?? 0)

        const boatTierMap: Record<number, BoatTier> = {
            10: "SMALL",
            20: "MEDIUM",
            50: "LARGE"
        }
        const boatTierKey = boatTierMap[boatLevel]
        const config = boatTierKey ? BOAT_CONFIG[boatTierKey] : null

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
        console.error('API_ERROR', {
            route: '/api/user',
            fid,
            error: error.message
        })
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
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

        // 🔒 ANTI-ABUSE: Wallet Binding Check
        if (walletAddress) {
            const existingUserForWallet = await redis.get(`wallet:${walletAddress}:user`)

            if (existingUserForWallet && existingUserForWallet !== fid) {
                return NextResponse.json({
                    error: 'WALLET_ALREADY_BOUND',
                    message: 'This wallet is already used by another account'
                }, { status: 400 })
            }

            // Bind wallet to this user
            await redis.set(`wallet:${walletAddress}:user`, fid)
        }

        // 🎣 Referral Logic Integration (Only for new users)
        if (referrerFid && referrerFid !== fid) {
            const alreadyExists = await redis.exists(`user:${fid}`)
            const alreadyReferred = await redis.get(`user:${fid}:referred_by`)

            if (!alreadyExists && !alreadyReferred) {
                // Store referral relationship
                await redis.hset(`user:${fid}`, { referredBy: referrerFid })

                // Update referrer stats (SAFE increments)
                const currentCount = Number(await redis.hget(`user:${referrerFid}`, 'referralCount') || 0)
                await redis.hset(`user:${referrerFid}`, { referralCount: String(currentCount + 1) })

                const totalReferred = Number(await redis.hget(`referral:${referrerFid}`, 'totalReferred') || 0)
                await redis.hset(`referral:${referrerFid}`, { totalReferred: String(totalReferred + 1) })

                // Add to invitees set
                await redis.sadd(`user:${referrerFid}:invitees`, fid)

                console.log(`🎣 New Referral: ${fid} referred by ${referrerFid}`)
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
