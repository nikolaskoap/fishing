'use client'

import React from 'react'

export default function FreeModeScreen() {
    return (
        <div className="min-h-screen flex flex-col bg-[#075985] font-sans">
            {/* Simple Top Bar */}
            <div className="p-4 flex justify-between items-center border-b border-white/10">
                <span className="font-black italic text-cyan-400">FREE MODE</span>
                <span className="text-[10px] font-bold opacity-30">LIMITED ACCESS</span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-hex-pattern">
                <div className="w-24 h-24 rounded-[2rem] bg-white/5 border border-dashed border-white/20 flex items-center justify-center text-5xl mb-6 opacity-30">🛶</div>
                <h3 className="text-2xl font-black italic mb-2">MINING LOCKED</h3>
                <p className="text-xs font-bold opacity-40 max-w-xs mb-10 leading-relaxed uppercase tracking-wider">You are in practice mode. Buy a boat to start earning real CAN Fish.</p>

                <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                    <button className="bg-[#A855F7] p-6 rounded-[2rem] border-b-6 border-[#581C87] flex flex-col items-center shadow-xl hover:translate-y-1 hover:border-b-4 transition-all">
                        <span className="text-2xl mb-1">🎡</span>
                        <span className="text-[10px] font-black">DAILY SPIN</span>
                    </button>
                    <button className="bg-[#4ADE80] p-6 rounded-[2rem] border-b-6 border-[#166534] flex flex-col items-center shadow-xl hover:translate-y-1 hover:border-b-4 transition-all">
                        <span className="text-2xl mb-1">👥</span>
                        <span className="text-[10px] font-black">INVITE</span>
                    </button>
                </div>

                <button className="mt-12 text-xs font-black text-cyan-400 underline decoration-cyan-400/30 underline-offset-8">
                    PURCHASE BOAT TO START EARNING
                </button>
            </div>
        </div>
    )
}
