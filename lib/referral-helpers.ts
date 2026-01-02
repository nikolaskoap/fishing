import { redis } from '@/lib/redis'
import { REFERRAL_CONFIG } from './referral-config'

/**
 * READ-ONLY: Check if referral meets activation criteria
 * Does NOT mutate data - safe for info/stats endpoints
 */
export async function isReferralActiveReadOnly(fid: string): Promise<boolean> {
    const user = await redis.hgetall(`user:${fid}`)

    if (!user) return false

    // Already marked as active
    if (user.referralActivated === "true") return true

    // Check criteria (but don't save)
    const casts = Number(user.totalSuccessfulCasts || 0)
    const fish = Number(user.minedFish || 0)
    const spins = Number(user.totalSpins || 0)

    return (
        casts >= REFERRAL_CONFIG.ACTIVATION.MIN_CASTS ||
        fish >= REFERRAL_CONFIG.ACTIVATION.MIN_FISH ||
        spins >= REFERRAL_CONFIG.ACTIVATION.MIN_SPINS
    )
}

/**
 * WRITE: Activate referral if eligible
 * ONLY call from mining/spin/boat routes
 */
export async function activateReferralIfEligible(fid: string): Promise<boolean> {
    const user = await redis.hgetall(`user:${fid}`)

    if (!user) return false

    // Already active
    if (user.referralActivated === "true") return true

    const casts = Number(user.totalSuccessfulCasts || 0)
    const fish = Number(user.minedFish || 0)
    const spins = Number(user.totalSpins || 0)

    const isEligible =
        casts >= REFERRAL_CONFIG.ACTIVATION.MIN_CASTS ||
        fish >= REFERRAL_CONFIG.ACTIVATION.MIN_FISH ||
        spins >= REFERRAL_CONFIG.ACTIVATION.MIN_SPINS

    if (isEligible) {
        await redis.hset(`user:${fid}`, { referralActivated: 'true' })
        return true
    }

    return false
}

/**
 * SAFE: Add fish to user balance
 * Normalizes before increment to prevent hincrbyfloat crashes
 */
export async function safeAddFish(fid: string, amount: number): Promise<void> {
    const currentFish = Number(await redis.hget(`user:${fid}`, 'minedFish') || 0)
    const newFish = currentFish + amount
    await redis.hset(`user:${fid}`, { minedFish: String(newFish) })
}

/**
 * ATOMIC: Check and increment daily cap
 * Uses daily-specific key to prevent race conditions
 */
export async function checkAndIncrementDailyCap(
    referrerFid: string,
    reward: number
): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const dailyKey = `referral:${referrerFid}:daily:${today}`

    const earnedToday = Number(await redis.get(dailyKey) || 0)

    // Check daily cap
    if (earnedToday + reward > REFERRAL_CONFIG.MAX_FISH_PER_DAY) {
        return false // Reject: would exceed daily cap
    }

    // ATOMIC: Increment daily earned
    await redis.set(dailyKey, String(earnedToday + reward))
    await redis.expire(dailyKey, 86400 * 2) // Auto-expire after 2 days

    return true
}

/**
 * SAFE: Grant milestone reward with all safety checks
 */
export async function checkAndRewardMilestone(
    referrerFid: string,
    inviteeFid: string,
    milestoneKey: string,
    reward: number
): Promise<boolean> {
    // 1. Check if already claimed
    const alreadyClaimed = await redis.sismember(
        `referral:${referrerFid}:milestones:${inviteeFid}`,
        milestoneKey
    )

    if (alreadyClaimed) return false

    // 2. Check daily cap (ATOMIC)
    const canReward = await checkAndIncrementDailyCap(referrerFid, reward)
    if (!canReward) return false

    // 3. Mark milestone as claimed
    await redis.sadd(`referral:${referrerFid}:milestones:${inviteeFid}`, milestoneKey)

    // 4. Grant reward (SAFE increment)
    await safeAddFish(referrerFid, reward)

    // 5. Update referral stats (SAFE)
    const currentEarned = Number(await redis.hget(`user:${referrerFid}`, 'referralFishEarned') || 0)
    await redis.hset(`user:${referrerFid}`, { referralFishEarned: String(currentEarned + reward) })

    const totalEarned = Number(await redis.hget(`referral:${referrerFid}`, 'totalFishEarned') || 0)
    await redis.hset(`referral:${referrerFid}`, { totalFishEarned: String(totalEarned + reward) })

    console.log(`🎁 Referral Reward: ${referrerFid} earned ${reward} fish from ${inviteeFid} milestone: ${milestoneKey}`)

    return true
}

/**
 * Get today's earned fish (for display)
 */
export async function getTodayEarned(fid: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0]
    const dailyKey = `referral:${fid}:daily:${today}`
    return Number(await redis.get(dailyKey) || 0)
}
