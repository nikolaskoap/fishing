'use client'

export const api = {
    async getUser(fid: number) {
        const res = await fetch(`/api/user?fid=${fid}`)
        return res.json()
    },

    async saveUser(data: any) {
        const res = await fetch('/api/user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        return res.json()
    },

    async cast(fid: number) {
        const res = await fetch('/api/mining/cast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fid })
        })
        return res.json()
    },

    async swap(fid: number, wallet: string, amount: number) {
        const res = await fetch('/api/withdraw', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fid,
                walletAddress: wallet,
                amountFish: amount,
                amountUSDC: amount // 1:1 Rate placeholder
            })
        })
        return res.json()
    }
}
