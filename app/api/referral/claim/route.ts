import { redis } from '@/lib/redis'
import { NextRequest, NextResponse } from 'next/server'
import { GLOBAL_CONFIG } from '@/lib/constants'

export async function POST(req: NextRequest) {
    try {
        const { userId } = await req.json()
        if (!userId) return NextResponse.json({ error: 'Missing UserID' }, { status: 400 })

        // Session Check
        const sessionActive = await redis.exists(`auth:session:${userId}`)
        if (!sessionActive) return NextResponse.json({ error: 'UNAUTHORIZED_SESSION' }, { status: 401 })

        const invitees = await redis.smembers(`user:${userId}:invitees`)
        let totalClaimed = 0

        for (const inviteeFid of invitees) {
            const alreadyClaimed = await redis.sismember(`user:${userId}:claimed_referrals`, inviteeFid)
            if (alreadyClaimed) continue

            const inviteeData: any = await redis.hgetall(`user:${inviteeFid}`)
            if (!inviteeData) continue

            const castCount = Number(inviteeData.totalSuccessfulCasts ?? 0)
            const isPaid = inviteeData.mode === "PAID_USER"

            if (isPaid && castCount >= GLOBAL_CONFIG.REFERRAL_MIN_CASTS) {
                // Atomic Claim
                await redis.sadd(`user:${userId}:claimed_referrals`, inviteeFid)
                totalClaimed += GLOBAL_CONFIG.REFERRAL_REWARD_USDC
            }
        }

        if (totalClaimed > 0) {
            await redis.hincrbyfloat(`user:${userId}`, 'referral_rewards_usdc', totalClaimed)
            await redis.hincrbyfloat('stats:global', 'total_referral_outflow', totalClaimed)
        }

        return NextResponse.json({
            success: true,
            totalClaimed,
            balance: await redis.hget(`user:${userId}`, 'referral_rewards_usdc')
        })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
