import { Redis } from '@upstash/redis'
import { isDeveloper } from '@/lib/constants'

export async function ensureUser(
    redis: Redis,
    fid: string,
    wallet?: string
) {
    const userKey = `user:${fid}`
    const exists = await redis.exists(userKey)

    const dev = isDeveloper(fid)
    const now = Date.now()

    // ===============================
    // USER DOES NOT EXIST → INITIALIZE
    // ===============================
    if (!exists) {
        const initWallet =
            wallet ??
            (dev ? `0xDEV_${fid}` : "N/A")

        const baseUser: Record<string, string | number> = {
            fid,
            wallet: initWallet,
            qualified: "false",
            createdAt: now,
            last_cast_at: 0,
            hourly_catches: 0,
            daily_catches: 0,
            minedFish: 0,
            rodLevel: 1
        }

        if (dev) {
            baseUser.mode = "PAID_USER"
            baseUser.boatTier = "LARGE"
            baseUser.catchingRate = "60"

            // 🔑 DEV SESSION AUTO-CREATE
            await redis.set(`auth:session:${fid}`, "DEV_BYPASS")
        } else {
            baseUser.mode = "FREE_USER"
        }

        await redis.hset(userKey, baseUser)

        console.log("AUTO_USER_INIT", {
            fid,
            dev,
            wallet: initWallet
        })

        return baseUser
    }

    // ===============================
    // USER EXISTS → LOAD
    // ===============================
    const user = await redis.hgetall<Record<string, string>>(userKey)

    // ===============================
    // DEV SESSION HEALING (IMPORTANT)
    // ===============================
    if (dev) {
        const hasSession = await redis.exists(`auth:session:${fid}`)
        if (!hasSession) {
            await redis.set(`auth:session:${fid}`, "DEV_BYPASS")
            console.log("DEV_SESSION_HEALED", { fid })
        }
    }

    return user
}
