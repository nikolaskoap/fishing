'use client'

import React from 'react'

interface BoosterPanelProps {
    onBuyBooster: (type: 'cast' | 'turbo') => void
    isBoosterActive: boolean
    isTurboActive: boolean
}

export default function BoosterPanel({
    onBuyBooster,
    isBoosterActive,
    isTurboActive
}: BoosterPanelProps) {
    return (
        <div className="flex flex-col gap-3 p-4 bg-[#001226]/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-2xl">
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center border-b border-white/5 pb-2 mb-1">
                Mining Boosters
            </h3>

            <button
                onClick={() => onBuyBooster('cast')}
                className={`group relative overflow-hidden p-4 rounded-xl transition-all duration-300 ${isBoosterActive
                        ? 'bg-cyan-500/20 border-cyan-500/50 shadow-[0_0_20px_rgba(34,211,238,0.2)]'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    } border`}
            >
                <div className="flex flex-col items-center gap-1">
                    <span className="text-2xl group-hover:scale-110 transition-transform">⚡</span>
                    <span className="font-black text-[11px] text-white">BOOSTER CAST</span>
                    <span className="text-[9px] text-cyan-400 font-bold">+5% SPEED</span>
                </div>
                <div className="absolute top-0 right-0 p-1">
                    <span className="text-[8px] font-mono text-gray-500">5 USDC</span>
                </div>
            </button>

            <button
                onClick={() => onBuyBooster('turbo')}
                className={`group relative overflow-hidden p-4 rounded-xl transition-all duration-300 ${isTurboActive
                        ? 'bg-orange-500/20 border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.2)]'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    } border`}
            >
                <div className="flex flex-col items-center gap-1">
                    <span className="text-2xl group-hover:scale-110 transition-transform">🔥</span>
                    <span className="font-black text-[11px] text-white">TURBO MODE</span>
                    <span className="text-[9px] text-orange-400 font-bold">+5% SPEED</span>
                </div>
                <div className="absolute top-0 right-0 p-1">
                    <span className="text-[8px] font-mono text-gray-500">5 USDC</span>
                </div>
            </button>

            <p className="text-[8px] text-gray-600 text-center italic">
                Boosters accelerate distribution but do not increase fish cap.
            </p>
        </div>
    )
}
