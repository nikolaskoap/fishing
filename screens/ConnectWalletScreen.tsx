'use client'

import React from 'react'

export default function ConnectWalletScreen({ onConnect }: { onConnect: () => void }) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-hex-pattern">
            <div className="bg-[#0c4a6e]/90 backdrop-blur-md p-8 rounded-[3rem] border-2 border-cyan-400 shadow-2xl text-center max-w-sm w-full animate-fade-in">
                <div className="w-20 h-20 bg-cyan-400 rounded-2xl flex items-center justify-center text-4xl mb-6 mx-auto shadow-lg shadow-cyan-400/20">🎣</div>
                <h2 className="text-3xl font-black italic tracking-tighter mb-2">WELCOME ANGLER</h2>
                <p className="text-xs font-bold text-cyan-300 opacity-60 uppercase tracking-widest mb-8">Connect your Warpcast wallet</p>

                <button
                    onClick={onConnect}
                    className="w-full bg-[#FDE047] hover:bg-[#FACC15] text-black font-black py-4 rounded-2xl shadow-[0_6px_0_#A16207] active:translate-y-1 active:shadow-none transition-all uppercase tracking-widest text-sm mb-4"
                >
                    Connect Wallet
                </button>

                <p className="text-[10px] opacity-40 font-bold uppercase">Safe & Secure via Base Network</p>
            </div>
        </div>
    )
}
