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
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black overflow-hidden">
            {/* Loading Animation Video */}
            <div className="absolute inset-0 z-0 flex items-center justify-center bg-black">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="max-w-full max-h-full object-contain"
                >
                    <source src="/assets/animation-loading/Make%20the%20images%20animated%20before%20combining%20them.mp4" type="video/mp4" />
                </video>
            </div>

            {/* Optional: Simple Loading Progress Bar at bottom */}
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-48 space-y-2 text-center">
                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 animate-[loading_3s_ease-in-out] w-full"></div>
                </div>
                <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest animate-pulse">Loading Game...</p>
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
