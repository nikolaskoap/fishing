'use client'

import React from 'react'

interface ConvertMenuProps {
    isOpen: boolean
    onClose: () => void
    fishBalance: number
    onConvert: (amount: number) => void
}

export function ConvertMenu({
    isOpen,
    onClose,
    fishBalance,
    onConvert
}: ConvertMenuProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-fade-in">
            <div className="bg-[#0c4a6e] border-4 border-cyan-400/50 p-8 rounded-[3rem] shadow-[0_0_50px_rgba(34,211,238,0.2)] w-full max-w-xs text-center relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-400/10 blur-[100px] rounded-full"></div>

                <h4 className="text-2xl font-black mb-6 italic tracking-tighter text-white drop-shadow-lg">CONVERT CENTER</h4>

                <div className="bg-black/30 p-8 rounded-[2rem] mb-8 border border-white/5 shadow-inner">
                    <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] mb-3">Claimable Fish</p>
                    <p className="text-4xl font-mono font-black text-[#FDE047] mb-1">
                        {fishBalance.toFixed(2)}
                    </p>
                    <div className="flex items-center justify-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                        <p className="text-[10px] font-bold text-cyan-400 uppercase opacity-80">Ready to process</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={() => { onConvert(fishBalance); onClose(); }}
                        className="w-full bg-[#22C55E] hover:bg-[#16A34A] p-5 rounded-2xl font-black text-sm uppercase tracking-widest text-white border-b-4 border-[#14532D] active:border-b-0 active:translate-y-1 transition-all shadow-xl"
                    >
                        Convert to CAN Fish
                    </button>

                    <button
                        onClick={onClose}
                        className="w-full bg-white/5 hover:bg-white/10 p-4 rounded-xl font-bold text-xs uppercase text-white/50 transition-colors"
                    >
                        Maybe Later
                    </button>
                </div>

                <p className="mt-6 text-[9px] font-bold text-white/20 uppercase tracking-widest line-clamp-1">
                    Base Fishing Protocol • v1.2
                </p>
            </div>
        </div>
    )
}
