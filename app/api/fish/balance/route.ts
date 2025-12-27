import { redis } from '@/lib/redis'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const fid = searchParams.get('fid')

        if (!fid) return NextResponse.json({ error: 'Missing FID' }, { status: 400 })

        const userData: any = await redis.hgetall(`user:${fid}`)
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
