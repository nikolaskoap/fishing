'use client'

import React, { useState, useEffect } from 'react'
import { SpinMenu } from '@/components/Home/SpinMenu'
import { useFrame } from '@/components/farcaster-provider'
import { api } from '@/services/api'

interface FreeModeScreenProps {
    onPurchaseBoat: () => void;
}

export default function FreeModeScreen({ onPurchaseBoat }: FreeModeScreenProps) {
    const { context } = useFrame()
    const fid = context?.user.fid

    const [isSpinOpen, setIsSpinOpen] = useState(false)
    const [spinTickets, setSpinTickets] = useState(0)
    const [lastDailySpin, setLastDailySpin] = useState(0)
    const [minedFish, setMinedFish] = useState(0)

    useEffect(() => {
        if (!fid) return
        const loadData = async () => {
            try {
                const data = await api.getUser(fid)
                if (data && !data.error) {
                    setSpinTickets(parseInt(data.spinTickets || '0'))
                    setLastDailySpin(parseInt(data.lastDailySpin || '0'))
                    setMinedFish(parseFloat(data.minedFish || '0'))
                }
            } catch (e) {
                console.error("Failed to load user data in FreeMode", e)
            }
        }
        loadData()
    }, [fid])

    const canSpinDaily = (Date.now() - lastDailySpin) > (24 * 60 * 60 * 1000)
    const totalSpinsAvailable = spinTickets + (canSpinDaily ? 1 : 0)

    const handleSpinWin = async (amount: number) => {
        const newMinedFish = minedFish + amount
        setMinedFish(newMinedFish)

        const now = Date.now()
        let newTickets = spinTickets
        let newLastSpin = lastDailySpin

        if (canSpinDaily) {
            newLastSpin = now
            setLastDailySpin(now)
        } else {
            newTickets = Math.max(0, spinTickets - 1)
            setSpinTickets(newTickets)
        }

        if (fid) {
            try {
                await api.saveUser({
                    fid,
                    minedFish: newMinedFish,
                    spinTickets: newTickets,
                    lastDailySpin: newLastSpin
                })
            } catch (e) {
                console.error("Failed to save spin result", e)
            }
        }
    }

    return (
        <div className="min-h-screen flex flex-col bg-[#075985] font-sans relative">
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
                    <button
                        onClick={() => setIsSpinOpen(true)}
                        className="bg-[#A855F7] p-6 rounded-[2rem] border-b-6 border-[#581C87] flex flex-col items-center shadow-xl hover:translate-y-1 hover:border-b-4 transition-all"
                    >
                        <span className="text-2xl mb-1">🎡</span>
                        <span className="text-[10px] font-black">DAILY SPIN</span>
                    </button>
                    <button
                        onClick={() => alert("Invite & Earn feature coming soon!")}
                        className="bg-[#4ADE80] p-6 rounded-[2rem] border-b-6 border-[#166534] flex flex-col items-center shadow-xl hover:translate-y-1 hover:border-b-4 transition-all"
                    >
                        <span className="text-2xl mb-1">👥</span>
                        <span className="text-[10px] font-black">INVITE</span>
                    </button>
                </div>

                <button
                    onClick={onPurchaseBoat}
                    className="mt-12 text-xs font-black text-cyan-400 underline decoration-cyan-400/30 underline-offset-8"
                >
                    PURCHASE BOAT TO START EARNING
                </button>
            </div>

            <SpinMenu
                isOpen={isSpinOpen}
                onClose={() => setIsSpinOpen(false)}
                tickets={totalSpinsAvailable}
                canSpinDaily={canSpinDaily}
                nextDailySpin={lastDailySpin + (24 * 3600 * 1000)}
                onSpinSuccess={handleSpinWin}
            />
        </div>
    )
}
