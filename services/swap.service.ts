'use client'

export const swapService = {
    async withdraw(fid: number, wallet: string, amount: number) {
        const res = await fetch('/api/withdraw', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fid,
                walletAddress: wallet,
                amountFish: amount,
                amountUSDC: amount // 1:1 Rate placeholder
            })
        });
        return res.json();
    }
}
