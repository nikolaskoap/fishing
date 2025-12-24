'use client'

import React from 'react'

export default function GlobalStats() {
    // Simulate some global stats for now
    const stats = {
        difficulty: "99.8%",
        totalSupply: "1,245,670",
        burnToday: "12,400",
        activeMiners: 124
    }

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
                        <p className="text-[8px] text-gray-500 uppercase font-black tracking-widest">Total Supply</p>
                        <p className="text-sm font-mono text-white font-bold">{stats.totalSupply} <span className="text-[8px] text-gray-600">FISH</span></p>
                    </div>
                    <div className="space-y-1 border-t border-white/5 pt-2">
                        <p className="text-[8px] text-gray-500 uppercase font-black tracking-widest">Fish Burned Today</p>
                        <p className="text-sm font-mono text-orange-400 font-bold">{stats.burnToday}</p>
                    </div>
                    <div className="space-y-1 border-t border-white/5 pt-2">
                        <p className="text-[8px] text-gray-500 uppercase font-black tracking-widest">Global Miners</p>
                        <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            <p className="text-sm font-mono text-white font-bold">{stats.activeMiners}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
