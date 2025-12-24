'use client'

import { useEffect, useState } from 'react'

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
    const [isAnimating, setIsAnimating] = useState(true)

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsAnimating(false)
            onFinish()
        }, 3000) // 3 seconds splash animation

        return () => clearTimeout(timer)
    }, [onFinish])

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#075985] overflow-hidden">
            {/* Ripple/Wave Background Effect */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] opacity-30">
                    <div className="w-full h-full animate-[ripple_10s_linear_infinite] rounded-full border border-cyan-400/40"></div>
                    <div className="absolute inset-0 w-full h-full animate-[ripple_10s_linear_infinite_2s] rounded-full border border-sky-400/30 scale-75"></div>
                </div>
            </div>

            {/* Logo Container */}
            <div className={`relative z-10 transition-all duration-1000 ${isAnimating ? 'opacity-100 scale-110' : 'opacity-0 scale-90'}`}>
                <div className="flex flex-col items-center space-y-4">
                    <div className="relative w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-cyan-300 to-sky-500 rounded-[2rem] flex items-center justify-center shadow-[0_0_80px_rgba(34,211,238,0.6)] overflow-hidden border-2 border-white/20">
                        <span className="text-4xl md:text-6xl">🎣</span>
                        <div className="absolute inset-0 bg-white/10 animate-[wave_3s_ease-in-out_infinite]"></div>
                    </div>

                    <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-blue-500 tracking-tighter drop-shadow-2xl">
                        BASE FISHING
                    </h1>

                    <div className="flex space-x-2">
                        <span className="h-1 w-12 bg-cyan-500 rounded-full animate-pulse"></span>
                        <span className="h-1 w-4 bg-white/20 rounded-full"></span>
                        <span className="h-1 w-4 bg-white/20 rounded-full"></span>
                    </div>
                </div>
            </div>

            <style jsx>{`
        @keyframes ripple {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
          50% { opacity: 0.1; }
          100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
        @keyframes wave {
          0%, 100% { transform: translateY(100%); }
          50% { transform: translateY(0%); }
        }
      `}</style>
        </div>
    )
}
