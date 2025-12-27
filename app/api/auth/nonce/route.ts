import { redis } from '@/lib/redis'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
    try {
        const { fid } = await req.json()
        if (!fid) return NextResponse.json({ error: 'Missing FID' }, { status: 400 })

        const nonce = crypto.randomBytes(16).toString('hex')

        // Store nonce in Redis with a short expiry (5 mins)
        await redis.set(`nonce:${fid}`, nonce, { ex: 300 })

        return NextResponse.json({ nonce })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
