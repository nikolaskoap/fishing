import React, { useState, useEffect } from 'react'

export default function GlobalStats() {
    const [stats, setStats] = useState({
        difficulty: "0%",
        totalCaught: "0",
        burnedFish: "0",
        totalPlayers: 0
    })

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/statistics/global')
                const data = await res.json()
                if (data && !data.error) {
                    setStats({
                        difficulty: `${data.difficulty}%`,
                        totalCaught: parseFloat(data.totalCaught).toLocaleString(),
                        burnedFish: parseFloat(data.burnedFish).toLocaleString(),
                        totalPlayers: data.totalPlayers
                    })
                }
            } catch (e) {
                console.error("Failed to fetch global stats", e)
            }
        }
        fetchStats()
        const interval = setInterval(fetchStats, 60000) // Refresh every minute
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="w-full max-w-md px-4 py-2">
            <div className="bg-[#001226]/30 border border-white/5 rounded-2xl p-4 backdrop-blur-sm">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-[8px] text-gray-500 uppercase font-black tracking-widest">Mining Difficulty</p>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-mono text-cyan-400 font-bold">{stats.difficulty}</span>
                            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-cyan-500 w-[99.8%] opacity-50"></div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[8px] text-gray-500 uppercase font-black tracking-widest">Total Caught</p>
                        <p className="text-sm font-mono text-white font-bold">{stats.totalCaught} <span className="text-[8px] text-gray-600">FISH</span></p>
                    </div>
                    <div className="space-y-1 border-t border-white/5 pt-2">
                        <p className="text-[8px] text-gray-500 uppercase font-black tracking-widest">Fish Burned</p>
                        <p className="text-sm font-mono text-orange-400 font-bold">{stats.burnedFish}</p>
                    </div>
                    <div className="space-y-1 border-t border-white/5 pt-2">
                        <p className="text-[8px] text-gray-500 uppercase font-black tracking-widest">Global Players</p>
                        <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            <p className="text-sm font-mono text-white font-bold">{stats.totalPlayers}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
