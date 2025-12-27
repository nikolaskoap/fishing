import React, { useState } from 'react'
import { miningService } from '@/services/mining.service'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'
import { USDT_ADDRESS, PAYMENT_RECIPIENT, ERC20_ABI } from "@/lib/contracts";

interface BoatOption {
    id: string
    name: string
    price: number
    rate: string
    emoji: string
    tier: number
}

interface BoatSelectionGateProps {
    fid: number;
    userId?: string;
    onSelect: (level: number) => void;
    onFreeMode: () => void;
}

export default function BoatSelectionGate({ fid, userId, onSelect, onFreeMode }: BoatSelectionGateProps) {
    const { address, isConnected } = useAccount()
    const { writeContract, data: hash, isPending: isWritePending } = useWriteContract()
    const [pendingTier, setPendingTier] = useState<number | null>(null)

    const { isLoading: isConfirming } = useWaitForTransactionReceipt({
        hash,
    })

    const boats: BoatOption[] = [
        { id: 'boat1', name: 'Small Boat', price: 10, rate: '15%', emoji: '🚤', tier: 10 },
        { id: 'boat2', name: 'Medium Boat', price: 20, rate: '16%', emoji: '🚢', tier: 20 },
        { id: 'boat3', name: 'Large Boat', price: 50, rate: '20%', emoji: '🛳️', tier: 50 },
    ]

    const handleSelect = async (boat: BoatOption) => {
        if (!isConnected) {
            alert("Please connect your wallet first")
            return
        }

        try {
            setPendingTier(boat.tier)

            // 1. Trigger Payment
            writeContract({
                address: USDT_ADDRESS,
                abi: ERC20_ABI,
                functionName: "transfer",
                args: [PAYMENT_RECIPIENT, parseUnits(boat.price.toString(), 6)],
            }, {
                onSuccess: async () => {
                    // 2. After transaction is sent, update server
                    try {
                        const res = await fetch('/api/boat/select', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: userId || fid.toString(), tier: boat.tier })
                        })
                        const data = await res.json()
                        if (data.activeTier) {
                            onSelect(boat.tier)
                        }
                    } catch (e) {
                        console.error("API Error", e)
                        setPendingTier(null)
                    }
                },
                onError: (err) => {
                    console.error("Payment Error", err)
                    setPendingTier(null)
                    alert("Transaction failed or cancelled")
                }
            })
        } catch (e) {
            console.error(e)
            setPendingTier(null)
        }
    }

    const handleFreeMode = async () => {
        try {
            await fetch('/api/boat/select', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userId || fid.toString(), tier: 0 })
            })
            onFreeMode()
        } catch (e) { console.error(e) }
    }

    const isProcessing = isWritePending || isConfirming

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#001226] p-4 font-sans text-white">
            <div className="relative mb-12 text-center">
                <h1 className="text-4xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500">
                    SELECT YOUR VESSEL
                </h1>
                <div className="h-1 w-24 bg-cyan-500 mx-auto mt-2 rounded-full shadow-[0_0_15px_#0ea5e9]"></div>
            </div>

            <div className="grid grid-cols-1 gap-4 w-full max-w-md">
                {boats.map((boat) => (
                    <button
                        key={boat.id}
                        onClick={() => !isProcessing && handleSelect(boat)}
                        disabled={isProcessing}
                        className={`group relative flex items-center gap-6 bg-[#075985]/40 p-6 rounded-[2.5rem] border-4 transition-all overflow-hidden
                            ${pendingTier === boat.tier
                                ? 'border-yellow-400 bg-[#075985]/80 animate-pulse'
                                : 'border-[#0ea5e9]/30 hover:border-[#0ea5e9] hover:bg-[#075985]/60'
                            }
                            ${isProcessing && pendingTier !== boat.tier ? 'opacity-40 grayscale' : ''}
                        `}
                    >
                        {/* Emoji Display */}
                        <div className="relative">
                            <span className="text-6xl group-hover:scale-110 transition-transform block">
                                {boat.emoji}
                            </span>
                            {pendingTier === boat.tier && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>

                        {/* Info Display */}
                        <div className="flex-1 text-left">
                            <h3 className="text-xl font-black italic leading-none mb-1">{boat.name}</h3>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full">
                                    {boat.rate} RATE
                                </span>
                                <span className="text-xs font-black text-yellow-400">
                                    {boat.price} USDC
                                </span>
                            </div>
                        </div>

                        {/* Buy Tag */}
                        <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/10 group-hover:bg-cyan-500 group-hover:text-black transition-colors font-black text-xs">
                            {pendingTier === boat.tier ? 'PROCESSING...' : 'SELECT'}
                        </div>
                    </button>
                ))}

                <button
                    onClick={handleFreeMode}
                    disabled={isProcessing}
                    className="group flex items-center justify-between p-6 bg-white/5 border-2 border-dashed border-white/10 rounded-[2.5rem] hover:bg-white/10 transition-all text-left mt-4 opacity-60 hover:opacity-100"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl group-hover:rotate-12 transition-transform">🛶</div>
                        <div>
                            <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Free Mode</p>
                            <p className="text-[10px] text-gray-500 font-bold italic">Practice Only • No Earnings</p>
                        </div>
                    </div>
                    <div className="bg-white/5 px-4 py-1 rounded-full border border-white/10 text-[10px] font-black text-gray-400 group-hover:bg-white/20 transition-colors uppercase">
                        Free
                    </div>
                </button>
            </div>

            <div className="mt-8 bg-[#0c4a6e]/50 backdrop-blur-md px-6 py-4 rounded-[2rem] border border-white/5 flex flex-col items-center gap-2 w-full max-w-sm">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#22D3EE]"></div>
                    <span className="text-[10px] font-black uppercase tracking-wider opacity-60">Secure USDC Payment via Base</span>
                </div>
                {!isConnected && (
                    <p className="text-[10px] text-red-400 font-bold animate-bounce mt-2 text-center">
                        Please connect your wallet in the previous screen!
                    </p>
                )}
            </div>
        </div>
    )
}
