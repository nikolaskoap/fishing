import React from 'react'
import { miningService } from '@/services/mining.service'
import { useFrame } from '@/components/farcaster-provider'

interface BoatOption {
    id: string
    name: string
    price: string
    rate: string
}

interface BoatSelectionGateProps {
    fid: number;
    userId?: string;
    onSelect: (level: number) => void;
    onFreeMode: () => void;
}

export default function BoatSelectionGate({ fid, userId, onSelect, onFreeMode }: BoatSelectionGateProps) {
    const boats: BoatOption[] = [
        { id: 'boat1', name: 'Small Boat', price: '10 USDC', rate: '15%' },
        { id: 'boat2', name: 'Medium Boat', price: '20 USDC', rate: '16%' },
        { id: 'boat3', name: 'Large Boat', price: '50 USDC', rate: '20%' },
    ]

    const handleSelect = async (boat: BoatOption) => {
        const level = boat.id === 'boat1' ? 10 : boat.id === 'boat2' ? 20 : 50
        try {
            const res = await fetch('/api/boat/select', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userId || fid.toString(), tier: level })
            })
            const data = await res.json()
            if (data.activeTier) {
                onSelect(level === 10 ? 1 : level === 20 ? 2 : 3)
            }
        } catch (e) { console.error(e) }
    }

    const handleFreeMode = async () => {
        try {
            await fetch('/api/boat/select', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userId || fid.toString(), tier: 'FREE' })
            })
            onFreeMode()
        } catch (e) { console.error(e) }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#001226] p-4">
            <h1 className="text-3xl font-black text-white mb-8">SELECT YOUR VESSEL</h1>

            <div className="grid grid-cols-1 gap-4 w-full max-w-md">
                {boats.map((boat) => (
                    <button
                        key={boat.id}
                        onClick={() => handleSelect(boat)}
                        className="bg-[#075985] p-6 rounded-3xl border-4 border-[#0ea5e9] text-left hover:scale-105 transition-transform shadow-xl"
                    >
                        <span className="text-7xl">
                            {boat.id === 'boat1' ? '🚤' : boat.id === 'boat2' ? '🚢' : '🛳️'}
                        </span>
                    </button>
                ))}

                <button
                    onClick={handleFreeMode}
                    className="group flex items-center justify-between p-6 bg-white/5 border-2 border-dashed border-white/10 rounded-[2rem] hover:bg-white/10 transition-all text-left mt-4"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-2xl group-hover:rotate-12 transition-transform">🛶</div>
                        <div>
                            <p className="text-gray-400 font-black uppercase tracking-widest text-sm">Free Mode</p>
                            <p className="text-[10px] text-gray-500 font-bold italic">No Earnings • Practice Only</p>
                        </div>
                    </div>
                    <span className="text-gray-500 font-black px-4 py-1 rounded-full border border-white/10 text-xs">GRATIS</span>
                </button>
            </div>

            <div className="bg-[#0c4a6e]/50 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/5 flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#22D3EE]"></div>
                <span className="text-[10px] font-black uppercase tracking-wider opacity-60">Secure USDC Checkout</span>
            </div>
        </div >
    )
}
