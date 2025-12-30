import { Redis } from '@upstash/redis'
import { isDeveloper } from '@/lib/constants'

export type UserData = Record<string, string>

export async function ensureUser(
    redis: Redis,
    fid: string,
    wallet?: string
): Promise<UserData> {
    const userKey = `user:${fid}`
    const sessionKey = `auth:session:${fid}`

    // 1. Ambil user data (kalau ada)
    let user = await redis.hgetall<UserData>(userKey)

    const isNewUser = !user || Object.keys(user).length === 0

    // 2. Default schema (WAJIB LENGKAP)
    const DEFAULT_USER: UserData = {
        fid,
        wallet: wallet ?? 'N/A',
        mode: 'FREE_USER',
        boatTier: 'SMALL',
        catchingRate: '0',
        qualified: 'false',

        // mining safety
        lastCastAt: '0',
        hourlyCatches: '0',
        dailyCatches: '0',
        currentIndex: '0',
        currentHour: Date.now().toString(),

        // economy
        minedFish: '0',
        xp: '0',

        createdAt: Date.now().toString()
    }

    // 3. CREATE USER jika belum ada
    if (isNewUser) {
        await redis.hset(userKey, DEFAULT_USER)
        user = DEFAULT_USER
    }

    // 4. HEAL USER (field yang hilang → ditambahkan)
    const healPayload: Record<string, string> = {}

    for (const key in DEFAULT_USER) {
        if (user![key] === undefined) {
            healPayload[key] = DEFAULT_USER[key]
        }
    }

    if (Object.keys(healPayload).length > 0) {
        await redis.hset(userKey, healPayload)
        user = { ...user!, ...healPayload }
    }

    // 5. WALLET BINDING (SET SEKALI SAJA)
    if (
        wallet &&
        user!.wallet !== 'N/A' &&
        user!.wallet !== wallet
    ) {
        throw new Error('WALLET_MISMATCH')
    }

    if (wallet && user!.wallet === 'N/A') {
        await redis.hset(userKey, { wallet })
        user!.wallet = wallet
    }

    // 6. DEVELOPER BYPASS (ABSOLUT)
    if (isDeveloper(fid)) {
        // session auto-heal
        await redis.set(sessionKey, '1')

        const devWallet = user!.wallet === 'N/A'
            ? `0xDEV_${fid}`
            : user!.wallet

        const DEV_PATCH: UserData = {
            wallet: devWallet,
            mode: 'PAID_USER',
            boatTier: 'LARGE',
            catchingRate: '0.2',
            qualified: 'true'
        }

        await redis.hset(userKey, DEV_PATCH)
        user = { ...user!, ...DEV_PATCH }
    }

    // 7. FINAL SAFETY CHECK
    if (!user) {
        throw new Error('ENSURE_USER_FAILED')
    }

    return user
}
