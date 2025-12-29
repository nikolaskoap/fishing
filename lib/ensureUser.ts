import { Redis } from '@upstash/redis'
import { isDeveloper } from './constants'

export interface User {
    fid: string;
    wallet: string;
    mode: "FREE_USER" | "PAID_USER";
    qualified: boolean | string;
    createdAt: number | string;
    last_cast_at: number | string;
    hourly_catches: number | string;
    daily_catches: number | string;
    [key: string]: any;
}

export async function ensureUser(
    redis: Redis,
    fid: string,
    wallet?: string
): Promise<User> {
    const userKey = `user:${fid}`

    // Use HGETALL to check existence and get data in one call
    let userData: any = await redis.hgetall(userKey)

    if (!userData || Object.keys(userData).length === 0) {
        const dev = isDeveloper(fid)
        const initialData: any = {
            fid: fid.toString(),
            wallet: wallet || "N/A",
            mode: dev ? "PAID_USER" : "FREE_USER",
            qualified: "false",
            createdAt: Date.now().toString(),
            last_cast_at: "0",
            hourly_catches: "0",
            daily_catches: "0",
            minedFish: "0",
            canFishBalance: "0",
            rodLevel: "1",
            activeBoatLevel: dev ? "50" : "0",
            xp: "0",
            spinTickets: "1",
            lastDailySpin: "0",
            socialVerified: dev ? "true" : "false"
        }

        await redis.hset(userKey, initialData)
        console.log(`AUTO_INITIALIZE_USER`, { fid, wallet: initialData.wallet, mode: initialData.mode })
        return initialData as User
    }

    // Standardize wallet field if it's missing but walletAddress exists
    if (!userData.wallet && userData.walletAddress) {
        userData.wallet = userData.walletAddress
        await redis.hset(userKey, { wallet: userData.wallet })
    }

    return userData as User
}
