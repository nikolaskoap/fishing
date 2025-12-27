import { redis } from '@/lib/redis'
import { NextRequest, NextResponse } from 'next/server'
import { GLOBAL_CONFIG } from '@/lib/constants'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const userId = searchParams.get('userId')

        if (!userId) return NextResponse.json({ error: 'Missing UserID' }, { status: 400 })

        const invitees = await redis.smembers(`user:${userId}:invitees`)
        const eligibleInvitees = []
        let totalPendingRevenue = 0

        for (const inviteeFid of invitees) {
            const inviteeData: any = await redis.hgetall(`user:${inviteeFid}`)
            if (!inviteeData) continue

            const castCount = parseInt(inviteeData.totalSuccessfulCasts || "0")
            const isPaid = inviteeData.mode === "PAID_USER"
            const alreadyClaimed = await redis.sismember(`user:${userId}:claimed_referrals`, inviteeFid)

            const isEligible = isPaid && castCount >= GLOBAL_CONFIG.REFERRAL_MIN_CASTS && !alreadyClaimed

            if (isEligible) {
                totalPendingRevenue += GLOBAL_CONFIG.REFERRAL_REWARD_USDC
            }

            eligibleInvitees.push({
                fid: inviteeFid,
                isPaid,
                castCount,
                isEligible,
                alreadyClaimed
            })
        }

        return NextResponse.json({
            invitees: eligibleInvitees,
            totalPendingRevenue,
            minCastsRequired: GLOBAL_CONFIG.REFERRAL_MIN_CASTS
        })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
