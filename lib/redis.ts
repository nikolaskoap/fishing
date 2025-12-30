import { Redis } from '@upstash/redis'

const url = process.env.UPSTASH_REDIS_REST_URL || 'https://no-redis-configured.com'
const token = process.env.UPSTASH_REDIS_REST_TOKEN || 'no-redis-configured'

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn('⚠️ Redis env missing - Application will fail at runtime if DB accessed. (OK for build time)')
}

export const redis = new Redis({
    url,
    token,
})
