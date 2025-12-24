'use client'

import React, { useState } from 'react'

export default function FollowGateScreen({ onComplete }: { onComplete: () => void }) {
    const [verifying, setVerifying] = useState(false)

    const handleVerify = () => {
        setVerifying(true)
        // Simulate social check
        setTimeout(() => {
            setVerifying(false)
            onComplete()
        }, 1500)
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-hex-pattern">
            <div className="bg-[#0c4a6e]/90 backdrop-blur-md p-8 rounded-[3rem] border-2 border-orange-400/50 shadow-2xl text-center max-w-sm w-full animate-fade-in">
                <div className="text-4xl mb-4">📣</div>
                <h2 className="text-2xl font-black italic mb-2 uppercase tracking-tighter text-white">Verification Gate</h2>
                <p className="text-[10px] font-bold text-orange-300 opacity-60 uppercase tracking-[0.2em] mb-8">Follow & Recast to enter the ocean</p>

                <div className="space-y-4 mb-8">
                    <a
                        href="https://warpcast.com"
                        target="_blank"
                        className="flex items-center justify-center gap-3 w-full bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-white/10 transition-all font-bold text-sm"
                    >
                        <span>Follow @basefishing</span>
                        <span className="text-[10px] bg-sky-500 px-2 py-0.5 rounded-full font-black">OPEN</span>
                    </a>

                    <button
                        onClick={handleVerify}
                        disabled={verifying}
                        className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all
                            ${verifying
                                ? 'bg-orange-500/20 text-orange-400 cursor-wait'
                                : 'bg-orange-500 hover:bg-orange-600 text-white shadow-[0_6px_0_#7c2d12]'
                            }`}
                    >
                        {verifying ? 'VERIFYING...' : 'I HAVE COMPLETED'}
                    </button>
                </div>
            </div>
        </div>
    )
}
