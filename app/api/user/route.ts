import { redis } from '@/lib/redis'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const fid = searchParams.get('fid')

    if (!fid) {
        return NextResponse.json({ error: 'Missing FID' }, { status: 400 })
    }

    try {
        const userData = await redis.hgetall(`user:${fid}`)
        const invitees = await redis.smembers(`user:${fid}:invitees`)

        if (!userData) {
            // Default new user
            return NextResponse.json({
                minedFish: 0,
                rodLevel: 1,
                lastSeen: Date.now(),
                spinTickets: 1, // Bonus 1 ticket for new user
                lastDailySpin: 0,
                referralCount: 0,
                invitees: [],
                activeBoatLevel: 0,
                boosterExpiry: 0
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
        const { fid, minedFish, rodLevel, activeBoatLevel, boosterExpiry, walletAddress, xp, spinTickets, lastDailySpin, referralCount, referrerFid } = body

        if (!fid) {
            return NextResponse.json({ error: 'Missing FID' }, { status: 400 })
        }

        // Referral Logic Integration
        if (referrerFid && referrerFid !== fid) {
            // Check if this user was already referred or is already in the system
            const alreadyExists = await redis.exists(`user:${fid}`)
            const alreadyReferred = await redis.get(`user:${fid}:referred_by`)

            if (!alreadyExists && !alreadyReferred) {
                // First time this user is seen and they have a referrer
                await redis.set(`user:${fid}:referred_by`, referrerFid)

                // Increment referrer's count
                await redis.hincrby(`user:${referrerFid}`, 'referralCount', 1)

                // Track WHO they invited
                await redis.sadd(`user:${referrerFid}:invitees`, fid)

                console.log(`User ${fid} referred by ${referrerFid}`)
            }
        }

        // Save to Redis
        const dataToSave = {
            minedFish,
            rodLevel,
            xp: xp || 0,
            activeBoatLevel: activeBoatLevel || 0,
            boosterExpiry: boosterExpiry || 0,
            lastSeen: Date.now(),
            ...(spinTickets !== undefined && { spinTickets }),
            ...(lastDailySpin !== undefined && { lastDailySpin }),
            ...(referralCount !== undefined && { referralCount }),
            ...(walletAddress && { wallet: walletAddress })
        }

        await redis.hset(`user:${fid}`, dataToSave)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Redis Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
