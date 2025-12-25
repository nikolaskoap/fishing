'use client'

export const spinService = {
    async execute(fid: number) {
        // Placeholder for future server-side spin logic
        const res = await fetch('/api/spin/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fid })
        });
        return res.json();
    }
}
