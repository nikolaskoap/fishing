import { redis } from '@/lib/redis'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const { fid, amount } = await req.json()

        if (!fid || amount === undefined) {
            return NextResponse.json({ error: 'Missing FID or amount' }, { status: 400 })
        }

        const userData: any = await redis.hgetall(`user:${fid}`)
        if (!userData) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const currentMined = parseFloat(userData.minedFish || "0")
        if (currentMined < amount) {
            return NextResponse.json({ error: 'Insufficient Fish balance' }, { status: 400 })
        }

        const conversionRate = 0.05
        const canFishToAdd = amount * conversionRate

        const newMinedFish = currentMined - amount
        const newCanFishBalance = parseFloat(userData.canFishBalance || "0") + canFishToAdd

        await redis.hset(`user:${fid}`, {
            minedFish: newMinedFish.toString(),
            canFishBalance: newCanFishBalance.toString()
        })

        return NextResponse.json({
            success: true,
            minedFish: newMinedFish,
            canFishBalance: newCanFishBalance
        })

    } catch (error) {
        console.error('Conversion Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
