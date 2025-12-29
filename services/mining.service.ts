import { FishRarity } from "@/components/Fishing/MiningController";
import { BOAT_CONFIG, BOAT_TIER_MAP } from "@/lib/constants";

export { BOAT_CONFIG, BOAT_TIER_MAP };

export const generateBucket = (fishPerHour: number): FishRarity[] => {
    const bucket: FishRarity[] = [];
    const junkCount = Math.floor(fishPerHour * 0.4);
    const commonCount = Math.floor(fishPerHour * 0.4);
    const uncommonCount = Math.floor(fishPerHour * 0.15);
    const epicCount = Math.floor(fishPerHour * 0.04);
    const legendaryCount = Math.floor(fishPerHour * 0.01);

    for (let i = 0; i < junkCount; i++) bucket.push('JUNK');
    for (let i = 0; i < commonCount; i++) bucket.push('COMMON');
    for (let i = 0; i < uncommonCount; i++) bucket.push('UNCOMMON');
    for (let i = 0; i < epicCount; i++) bucket.push('EPIC');
    for (let i = 0; i < legendaryCount; i++) bucket.push('LEGENDARY');

    // Shuffle the bucket
    for (let i = bucket.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bucket[i], bucket[j]] = [bucket[j], bucket[i]];
    }

    return bucket;
}

export const miningService = {
    async getUser(fid: number) {
        const res = await fetch(`/api/user?fid=${fid}`);
        return res.json();
    },

    async saveUser(data: any) {
        const res = await fetch('/api/user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },

    async connect(fid: number, wallet: string) {
        const res = await fetch('/api/auth/connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fid, walletAddress: wallet })
        });
        return res.json();
    },

    async verifySocial(userId: string, followed: boolean, recasted: boolean) {
        const res = await fetch('/api/auth/verify-social', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, followed, recasted })
        });
        return res.json();
    },

    async startMining(fid: string) {
        const res = await fetch('/api/mining/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: fid }) // The route still expects 'userId' but it will be the FID
        });
        return res.json();
    },

    async cast(fid: string) {
        const res = await fetch('/api/mining/cast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: fid }) // The route still expects 'userId' but it will be the FID
        });
        return res.json();
    },

    async convert(fid: number, amount: number) {
        const res = await fetch('/api/mining/convert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fid, amount })
        });
        return res.json();
    }
}
