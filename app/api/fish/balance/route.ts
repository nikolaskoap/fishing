import { redis } from '@/lib/redis'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const userId = searchParams.get('userId')

        if (!userId) return NextResponse.json({ error: 'Missing UserID' }, { status: 400 })

        const userData = await redis.hgetall(`user:${userId}`)
        if (!userData) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        const totalFish = parseFloat(userData.minedFish || "0")
        const level = Math.floor(totalFish / 1000) + 1

        return NextResponse.json({
            canFish: parseFloat(userData.canFishBalance || "0"),
            totalFish: totalFish,
            level: level
        })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
