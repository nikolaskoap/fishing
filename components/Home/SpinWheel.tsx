'use client'

import { useState, useEffect } from 'react'

interface SpinWheelProps {
    onWin: (amount: number) => void
    tickets: number
}

// Map Rarity to Image Assets (Verified paths based on directory search)
const PRIZE_IMAGES: Record<string, string> = {
    'LEGENDARY': '/assets/image/legendary fish.jpg',
    'EPIC': '/assets/image/fish rare.jpg',
    'RARE': '/assets/image/fish uncommon.jpg',
    'COMMON': '/assets/image/fish cummon.jpg',
    'TRY_AGAIN': '/assets/image/icon.png'
}

export function SpinWheel({ onWin, tickets }: SpinWheelProps) {
    const [isSpinning, setIsSpinning] = useState(false)
    const [result, setResult] = useState<{ rarity: string, val: number } | null>(null)
    const [rotation, setRotation] = useState<number>(0)
    const [showResultPopup, setShowResultPopup] = useState(false)

    useEffect(() => {
        if (result) {
            setShowResultPopup(true)
        } else {
            setShowResultPopup(false)
        }
    }, [result])

    const spin = async () => {
        if (isSpinning || tickets <= 0) return

        setIsSpinning(true)
        setResult(null)
        setShowResultPopup(false)

        try {
            const userId = (window as any).userId || localStorage.getItem('userId')

            const res = await fetch('/api/spin/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fid: userId })
            })
            const data = await res.json()

            if (!data.success) {
                alert(data.error || "Spin failed")
                setIsSpinning(false)
                return
            }

            const { rarity, prize } = data

            // Visual Spin: Add extra spins (1800-2160 deg) + random variance
            const newRotation = rotation + 1800 + Math.random() * 360
            setRotation(newRotation)

            // 5 second animation
            setTimeout(() => {
                setResult({ rarity, val: prize })
                setIsSpinning(false)
                onWin(prize) // This updates the parent balance
            }, 5000)

        } catch (e) {
            console.error("Spin error", e)
            setIsSpinning(false)
        }
    }

    return (
        <div className="flex flex-col items-center justify-center p-4 w-full relative min-h-[400px]">

            <style jsx>{`
                @keyframes bounceSubtle {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                .animate-bounce-subtle {
                    animation: bounceSubtle 2s infinite ease-in-out;
                }
                @keyframes fadeInScale {
                    from { opacity: 0; transform: scale(0.5); }
                    to { opacity: 1; transform: scale(1); }
                }
                .fade-in-scale {
                    animation: fadeInScale 0.3s ease-out forwards;
                }
            `}</style>

            {/* WHEEL CONTAINER */}
            <div className="relative w-[280px] h-[280px] md:w-[320px] md:h-[320px] mb-8">

                {/* POINTER */}
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20 drop-shadow-xl">
                    <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[35px] border-t-red-600"></div>
                </div>

                {/* ROTATING WHEEL IMAGE */}
                <div
                    className="w-full h-full rounded-full overflow-hidden"
                    style={{
                        transform: `rotate(${rotation}deg)`,
                        transition: 'transform 5s cubic-bezier(0.25, 0.1, 0.25, 1)',
                        boxShadow: '0 0 20px rgba(0,0,0,0.5)'
                    }}
                >
                    <img
                        src="/assets/image/spin.png"
                        alt="Spin Wheel"
                        className="w-full h-full object-cover"
                        // Using mix-blend-mode to make white background transparent if needed
                        style={{ mixBlendMode: 'multiply' }}
                        onError={(e) => {
                            e.currentTarget.src = "/assets/image/icon.png" // Fallback
                        }}
                    />
                </div>
            </div>

            {/* RESULT POPUP */}
            {showResultPopup && result && (
                <div className="absolute inset-0 z-50 flex items-center justify-center fade-in-scale">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setResult(null)} />

                    {/* Card Container */}
                    <div className="bg-[#0f172a] border-2 border-yellow-500/50 p-6 rounded-2xl shadow-[0_0_50px_rgba(234,179,8,0.2)] relative z-10 flex flex-col items-center text-center max-w-xs w-full mx-4 animate-bounce-subtle">

                        {/* Rarity Title */}
                        <h2 className={`text-2xl font-black uppercase mb-4 tracking-widest
                            ${result.rarity === 'LEGENDARY' ? 'text-yellow-400 drop-shadow-[0_0_10px_gold]' :
                                result.rarity === 'EPIC' ? 'text-purple-400 drop-shadow-[0_0_10px_purple]' :
                                    result.rarity === 'RARE' ? 'text-blue-400' : 'text-green-400'}
                        `}>
                            {result.rarity === 'COMMON' ? 'GOTCHA!' : result.rarity}
                        </h2>

                        {/* Fish Image */}
                        <div className="w-32 h-32 mb-4 relative">
                            <img
                                src={PRIZE_IMAGES[result.rarity] || '/assets/image/icon.png'}
                                alt={result.rarity}
                                className="w-full h-full object-contain drop-shadow-2xl"
                            />
                        </div>

                        {/* Reward Text */}
                        <div className="text-white text-lg font-bold mb-1">
                            You caught a Fish!
                        </div>
                        <div className="text-yellow-400 text-3xl font-black mb-6 flex items-center gap-2">
                            +{result.val} <span className="text-sm text-yellow-200/70 font-normal">MINED FISH</span>
                        </div>

                        <button
                            onClick={() => setResult(null)}
                            className="w-full py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold text-lg rounded-xl shadow-lg transform transition active:scale-95"
                        >
                            CLAIM REWARD
                        </button>
                    </div>
                </div>
            )}

            {/* BUTTON */}
            <div className="w-full max-w-xs z-10">
                <button
                    onClick={spin}
                    disabled={isSpinning || tickets <= 0}
                    className={`
                        w-full py-4 rounded-xl font-bold text-xl uppercase tracking-widest transition-all transform active:scale-95 shadow-lg border-b-4
                        ${isSpinning || tickets <= 0
                            ? 'bg-gray-800 text-gray-500 border-gray-900 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-500 text-white border-green-800 shadow-green-500/20'
                        }
                    `}
                >
                    {isSpinning ? 'SPINNING...' : 'SPIN THE WHEEL'}
                </button>
            </div>
        </div>
    )
}
