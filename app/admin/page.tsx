'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type WithdrawRequest = {
    id: string
    fid: number
    walletAddress: string
    amountFish: number
    amountUSDC: number
    status: string
    createdAt: string
}

export default function AdminDashboard() {
    const [withdrawals, setWithdrawals] = useState<WithdrawRequest[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        // Basic Auth Check (Frontend side only, real protect is API)
        // We try to fetch withdraws, if 401/403 -> redirect login
        fetchWithdrawals()

        const interval = setInterval(fetchWithdrawals, 30000) // Refresh every 30s
        return () => clearInterval(interval)
    }, [])

    const fetchWithdrawals = async () => {
        try {
            const res = await fetch('/api/withdraw')
            if (res.status === 401 || res.status === 403) {
                router.push('/admin/login')
                return
            }
            const data = await res.json()
            if (data.withdrawals) {
                setWithdrawals(data.withdrawals)
            }
        } catch (e) {
            console.error("Failed to fetch", e)
        } finally {
            setIsLoading(false)
        }
    }

    const handleLogout = async () => {
        await fetch('/api/admin/logout', { method: 'POST' })
        router.push('/admin/login')
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        alert("Address Copied!")
    }

    return (
        <div className="min-h-screen bg-[#000814] text-white font-sans">
            {/* Header */}
            <div className="border-b border-gray-800 p-4 flex justify-between items-center sticky top-0 bg-[#000814]/90 backdrop-blur z-20">
                <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                    Admin Dashboard
                </h1>
                <button
                    onClick={handleLogout}
                    className="text-xs text-red-400 border border-red-900 px-3 py-1 rounded hover:bg-red-900/20"
                >
                    Logout
                </button>
            </div>

            {/* Content */}
            <div className="p-4 max-w-4xl mx-auto space-y-4">
                {isLoading ? (
                    <p className="text-gray-500 text-center animate-pulse">Loading data...</p>
                ) : withdrawals.length === 0 ? (
                    <div className="text-center p-8 bg-[#001226] rounded-xl text-gray-500">
                        No withdraw requests yet.
                    </div>
                ) : (
                    withdrawals.map((w) => (
                        <div key={w.id} className="bg-[#001226]/80 p-4 rounded-xl border border-gray-800 flex flex-col gap-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className={`text-[10px] px-2 py-0.5 rounded ${w.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-green-500/20 text-green-500'} uppercase font-bold tracking-wider`}>
                                        {w.status}
                                    </span>
                                    <p className="text-xs text-gray-500 mt-1">{new Date(w.createdAt).toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold font-mono text-green-400">${w.amountUSDC.toFixed(2)}</p>
                                    <p className="text-xs text-gray-400">{w.amountFish.toFixed(2)} Fish</p>
                                </div>
                            </div>

                            <div className="bg-black/50 p-2 rounded border border-gray-800/50 flex items-center justify-between gap-2">
                                <code className="text-xs text-blue-300 truncate font-mono">
                                    {w.walletAddress}
                                </code>
                                <button
                                    onClick={() => copyToClipboard(w.walletAddress)}
                                    className="bg-[#0A5CDD] text-white text-[10px] px-2 py-1 rounded hover:bg-blue-600"
                                >
                                    COPY
                                </button>
                            </div>

                            <div className="border-t border-gray-800 pt-2 flex justify-between items-center">
                                <span className="text-xs text-gray-500">FID: {w.fid}</span>
                                {/* Action Buttons (Mock) */}
                                <div className="flex gap-2">
                                    {/* You can implement Approve/Reject API later */}
                                    <button className="text-[10px] text-gray-500 hover:text-white">Mark Processed</button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
