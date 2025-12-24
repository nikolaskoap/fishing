'use client'

import { useState } from 'react'

export default function FollowGate({ onComplete }: { onComplete: () => void }) {
    const [checking, setChecking] = useState(false)
    const [followed, setFollowed] = useState(false)
    const [recasted, setRecasted] = useState(false)

    const handleCheck = () => {
        setChecking(true)
        // Simulate API call to check Farcaster actions
        setTimeout(() => {
            setFollowed(true)
            setRecasted(true)
            setChecking(false)
        }, 1500)
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center space-y-8 animate-fade-in">
            <div className="space-y-2">
                <h2 className="text-3xl font-black text-white tracking-tight">JOIN THE CREW</h2>
                <p className="text-gray-400 text-sm max-w-xs mx-auto">
                    Follow & Recast to unlock the Abyssal Waters.
                </p>
            </div>

            <div className="w-full max-w-xs space-y-4">
                <div className={`p-4 rounded-2xl border transition-all ${followed ? 'bg-green-500/10 border-green-500/50' : 'bg-white/5 border-white/10'}`}>
                    <div className="flex items-center justify-between">
                        <span className="text-white font-bold">Follow @basefishing</span>
                        {followed ? (
                            <span className="text-green-400 text-xl">✅</span>
                        ) : (
                            <a href="#" className="bg-blue-500 hover:bg-blue-600 px-4 py-1.5 rounded-full text-xs font-bold text-white transition-colors">FOLLOW</a>
                        )}
                    </div>
                </div>

                <div className={`p-4 rounded-2xl border transition-all ${recasted ? 'bg-green-500/10 border-green-500/50' : 'bg-white/5 border-white/10'}`}>
                    <div className="flex items-center justify-between">
                        <span className="text-white font-bold">Recast Announcement</span>
                        {recasted ? (
                            <span className="text-green-400 text-xl">✅</span>
                        ) : (
                            <a href="#" className="bg-blue-500 hover:bg-blue-600 px-4 py-1.5 rounded-full text-xs font-bold text-white transition-colors">RECAST</a>
                        )}
                    </div>
                </div>
            </div>

            <div className="w-full max-w-xs pt-4">
                {followed && recasted ? (
                    <button
                        onClick={onComplete}
                        className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl font-black text-white shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:scale-[1.02] active:scale-95 transition-all text-xl"
                    >
                        ENTER THE GAME
                    </button>
                ) : (
                    <button
                        onClick={handleCheck}
                        disabled={checking}
                        className="w-full py-4 bg-white/10 border border-white/20 rounded-2xl font-bold text-white hover:bg-white/20 transition-all"
                    >
                        {checking ? (
                            <div className="flex items-center justify-center space-x-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>CHECKING...</span>
                            </div>
                        ) : 'VERIFY STATUS'}
                    </button>
                )}
            </div>

            <p className="text-[10px] text-gray-600 uppercase tracking-widest">
                Validation simulation active
            </p>
        </div>
    )
}
