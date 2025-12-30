import { MiniAppNotificationDetails } from "@farcaster/miniapp-sdk";
import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL || 'https://no-redis-configured.com'
const token = process.env.UPSTASH_REDIS_REST_TOKEN || 'no-redis-configured'

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.warn('⚠️ Redis env missing in lib/kv.ts - Usage will fail at runtime. (OK for build time)')
}

const redis = new Redis({
  url,
  token,
})

function getUserNotificationDetailsKey(fid: number): string {
  return `${fid}`;
}

export async function getUserNotificationDetails(
  fid: number
): Promise<MiniAppNotificationDetails | null> {
  return await redis.get<MiniAppNotificationDetails>(
    getUserNotificationDetailsKey(fid)
  );
}

export async function setUserNotificationDetails(
  fid: number,
  notificationDetails: MiniAppNotificationDetails
): Promise<void> {
  await redis.set(getUserNotificationDetailsKey(fid), notificationDetails);
}

export async function deleteUserNotificationDetails(
  fid: number
): Promise<void> {
  await redis.del(getUserNotificationDetailsKey(fid));
}