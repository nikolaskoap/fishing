import { redis } from '@/lib/redis'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: NextRequest) {
    try {
        const { walletAddress, fid } = await req.json()

        if (!fid || !walletAddress) {
            return NextResponse.json({ error: 'Missing FID or Wallet' }, { status: 400 })
        }

        // Check if user exists
        let userId = await redis.get(`wallet:${walletAddress}:uid`)

        if (!userId) {
            userId = uuidv4()
            await redis.set(`wallet:${walletAddress}:uid`, userId)
            await redis.hset(`user:${userId}`, {
                id: userId,
                fid: fid.toString(),
                walletAddress,
                socialVerified: "false",
                mode: "null",
                createdAt: Date.now().toString()
            })
        }

        const userData = await redis.hgetall(`user:${userId}`)

        return NextResponse.json({
            userId,
            socialVerified: userData?.socialVerified === "true",
            mode: userData?.mode || null
        })
    } catch (error) {
        console.error('Auth Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
