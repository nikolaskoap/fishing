'use client'

import React from 'react'

interface StatsMenuProps {
    isOpen: boolean
    onClose: () => void
    stats: {
        totalCaught: number
        xp: number
        level: number
        rodLevel: number
        boatLevel: number
    }
}

export function StatsMenu({ isOpen, onClose, stats }: StatsMenuProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative w-full max-w-sm bg-[#0c4a6e] border-2 border-[#0ea5e9]/30 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50"></div>

                <button onClick={onClose} className="absolute top-6 right-6 text-xl opacity-50 hover:opacity-100 transition-opacity">✕</button>

                <h2 className="text-2xl font-black italic text-white mb-8 tracking-tighter">STATISTICS</h2>

                <div className="space-y-6">
                    <StatItem label="TOTAL FISH CAUGHT" value={stats.totalCaught.toFixed(2)} unit="FISH" color="text-yellow-400" />
                    <StatItem label="CURRENT XP" value={stats.xp} unit={`/ ${(Math.floor(stats.xp / 500) + 1) * 500}`} color="text-cyan-400" />
                    <StatItem label="PLAYER LEVEL" value={stats.level} unit="LVL" color="text-green-400" />
                    <StatItem label="ROD QUALITY" value={`Level ${stats.rodLevel}`} unit="" color="text-orange-400" />
                    <StatItem label="VESSEL CLASS" value={`Type ${stats.boatLevel}`} unit="" color="text-blue-400" />
                </div>

                <div className="mt-8 pt-6 border-t border-white/10">
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] text-center">Global Ranking: #124</p>
                </div>
            </div>
        </div>
    )
}

function StatItem({ label, value, unit, color }: { label: string, value: string | number, unit: string, color: string }) {
    return (
        <div className="flex justify-between items-end border-b border-white/5 pb-2">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{label}</span>
            <div className={`font-mono font-black ${color} flex items-baseline gap-1`}>
                <span className="text-xl">{value}</span>
                <span className="text-[10px] opacity-60">{unit}</span>
            </div>
        </div>
    )
}
