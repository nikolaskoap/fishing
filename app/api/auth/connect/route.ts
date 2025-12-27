import { redis } from '@/lib/redis'
import { NextRequest, NextResponse } from 'next/server'
import { isDeveloper } from '@/lib/constants'

export async function POST(req: NextRequest) {
    try {
        const { walletAddress, fid } = await req.json()

        if (!fid || !walletAddress) {
            return NextResponse.json({ error: 'Missing FID or Wallet' }, { status: 400 })
        }

        const userKey = `user:${fid}`
        let userData: any = await redis.hgetall(userKey)

        if (!userData) {
            const dev = isDeveloper(fid)
            await redis.hset(userKey, {
                id: fid.toString(),
                fid: fid.toString(),
                walletAddress,
                socialVerified: dev ? "true" : "false",
                mode: dev ? "PAID" : "null",
                createdAt: Date.now().toString(),
                minedFish: "0",
                canFishBalance: "0",
                rodLevel: "1",
                activeBoatLevel: dev ? "50" : "0",
                xp: "0",
                spinTickets: "1",
                lastDailySpin: "0"
            })
            userData = await redis.hgetall(userKey)
        } else {
            // Update wallet address if it changed
            if (userData.walletAddress !== walletAddress) {
                await redis.hset(userKey, { walletAddress })
            }

            // Auto-upgrade if is developer but not yet verified/boatless
            if (isDeveloper(fid) && (userData.socialVerified !== "true" || userData.activeBoatLevel === "0")) {
                const upgradeData = {
                    socialVerified: "true",
                    activeBoatLevel: "50",
                    mode: "PAID"
                }
                await redis.hset(userKey, upgradeData)
                userData = { ...userData, ...upgradeData }
            }
        }

        return NextResponse.json({
            userId: fid.toString(),
            socialVerified: userData?.socialVerified === "true",
            mode: userData?.mode || null
        })
    } catch (error) {
        console.error('Auth Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
