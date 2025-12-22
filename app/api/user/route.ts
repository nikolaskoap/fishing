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

        if (!userData) {
            // Default new user
            return NextResponse.json({
                minedFish: 0,
                rodLevel: 1,
                lastSeen: Date.now()
            })
        }

        return NextResponse.json(userData)
    } catch (error) {
        console.error('Redis Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { fid, minedFish, rodLevel, walletAddress } = body

        if (!fid) {
            return NextResponse.json({ error: 'Missing FID' }, { status: 400 })
        }

        // Save to Redis
        // We update lastSeen to connect offline calculation later if needed, 
        // though the client calculates offline diff.
        const dataToSave = {
            minedFish,
            rodLevel,
            lastSeen: Date.now(),
            ...(walletAddress && { wallet: walletAddress })
        }

        await redis.hset(`user:${fid}`, dataToSave)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Redis Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
