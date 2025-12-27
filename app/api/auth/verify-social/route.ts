import { redis } from '@/lib/redis'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const { userId, followed, recasted } = await req.json()

        if (!userId) return NextResponse.json({ error: 'Missing UserID/FID' }, { status: 400 })

        const userData: any = await redis.hgetall(`user:${userId}`)
        if (!userData) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        // Check if already locked
        if (userData.socialVerified === "true") {
            return NextResponse.json({
                verified: true,
                lockedAt: userData.verifiedAt,
                canSelectBoat: true
            })
        }

        // Logic verification (In prod, we check Farcaster API here)
        if (followed && recasted) {
            const verifiedAt = Date.now().toString()
            await redis.hset(`user:${userId}`, {
                socialVerified: "true",
                verifiedAt: verifiedAt
            })

            return NextResponse.json({
                verified: true,
                lockedAt: verifiedAt,
                canSelectBoat: true
            })
        }

        return NextResponse.json({ verified: false })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
