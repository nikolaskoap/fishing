'use client'

import { FishRarity } from "@/components/Fishing/MiningController";

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

    async startMining(userId: string) {
        const res = await fetch('/api/mining/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });
        return res.json();
    },

    async cast(userId: string) {
        const res = await fetch('/api/mining/cast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
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
