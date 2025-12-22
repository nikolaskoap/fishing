'use client'

import { useState } from 'react'

interface SpinWheelProps {
    onWin: (amount: number) => void
    tickets: number
}

const PRIZES = [
    { amount: 100, label: '$100', color: '#F472B6' },
    { amount: 50, label: '$50', color: '#A78BFA' },
    { amount: 20, label: '$20', color: '#60A5FA' },
    { amount: 10, label: '$10', color: '#34D399' },
    { amount: 5, label: '$5', color: '#FBBF24' },
    { amount: 1, label: '$1', color: '#F87171' },
    { amount: 0.5, label: '$0.5', color: '#9CA3AF' },
    { amount: 0.1, label: '$0.1', color: '#D1D5DB' },
    { amount: 0.05, label: '$0.05', color: '#E5E7EB' }, // Common
]

export function SpinWheel({ onWin, tickets }: SpinWheelProps) {
    const [isSpinning, setIsSpinning] = useState(false)
    const [lastWin, setLastWin] = useState<number | null>(null)

    const spin = () => {
        if (isSpinning || tickets <= 0) return

        setIsSpinning(true)
        setLastWin(null)

        // Simulate Network/Processing time
        setTimeout(() => {
            const rand = Math.random() * 100 // 0 to 100
            let winAmount = 0.05

            // Probability Logic
            // 0.05 -> 99.9% chance (if rand < 99.9)
            // Others -> 0.1% shared

            if (rand < 99.9) {
                winAmount = 0.05
            } else {
                // The remaining 0.1% (rand >= 99.9)
                // Divide this tiny slice among the rest
                // Let's just randomize simply among the rest for this "100% difficult" tier
                const rareMsg = Math.random()
                if (rareMsg < 0.9) winAmount = 0.1
                else if (rareMsg < 0.99) winAmount = 0.5
                else {
                    // Extremelly rare super jackpot (0.001% of total spins basically)
                    const jackpotRand = Math.random()
                    if (jackpotRand < 0.5) winAmount = 1
                    else if (jackpotRand < 0.8) winAmount = 5
                    else if (jackpotRand < 0.9) winAmount = 10
                    else if (jackpotRand < 0.95) winAmount = 20
                    else if (jackpotRand < 0.99) winAmount = 50
                    else winAmount = 100
                }
            }

            onWin(winAmount)
            setLastWin(winAmount)
            setIsSpinning(false)
        }, 2000) // 2 second spin animation time
    }

    return (
        <div className="flex flex-col items-center justify-center space-y-4 p-4 rounded-xl bg-[#001226]/50 border border-[#0A5CDD]/20 w-full">
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500 uppercase tracking-wider">
                Lucky Spin
            </h3>

            <div className="relative w-48 h-48 rounded-full border-4 border-yellow-500/30 flex items-center justify-center bg-black/40 overflow-hidden shadow-[0_0_20px_rgba(234,179,8,0.2)]">
                {/* Simple visual representation */}
                <div className={`transition-all duration-100 text-6xl ${isSpinning ? 'animate-spin blur-sm opacity-50' : 'animate-bounce'}`}>
                    🎰
                </div>
                {lastWin !== null && !isSpinning && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10 animate-in fade-in zoom-in">
                        <p className="text-2xl font-bold text-yellow-400 drop-shadow-md">
                            +${lastWin}
                        </p>
                    </div>
                )}
            </div>

            <button
                onClick={spin}
                disabled={isSpinning || tickets <= 0}
                className={`
            w-full py-3 rounded-lg font-bold text-lg uppercase tracking-widest transition-all transform active:scale-95
            ${isSpinning || tickets <= 0
                        ? 'bg-gray-600 cursor-not-allowed opacity-50'
                        : 'bg-gradient-to-r from-yellow-500 to-red-600 hover:from-yellow-400 hover:to-red-500 shadow-lg text-white ring-2 ring-yellow-500/50'
                    }
        `}
            >
                {isSpinning ? 'SPINNING...' : tickets > 0 ? 'SPIN FOR $100' : 'NO TICKETS'}
            </button>

            <p className="text-[10px] text-gray-500 text-center">
                Win up to $100 USDC! <br />
                <span className="text-gray-600">Odds: $0.05 (99.9%), Others (0.1%)</span>
            </p>
        </div>
    )
}
