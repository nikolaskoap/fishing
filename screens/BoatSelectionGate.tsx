import React from 'react'
import { api } from '@/services/api'
import { useFrame } from '@/components/farcaster-provider'

interface BoatOption {
    id: string
    name: string
    price: number
    rate: number
    bonus: number
    color: string
}

const BOATS: BoatOption[] = [
    { id: 'boat1', name: 'Rookie Raft', price: 10, rate: 100, bonus: 10, color: 'blue' },
    { id: 'boat2', name: 'Coastal Cruiser', price: 20, rate: 150, bonus: 15, color: 'purple' },
    { id: 'boat3', name: 'Deep Sea Hunter', price: 50, rate: 250, bonus: 25, color: 'yellow' },
]

export default function BoatSelection({
    onSelect,
    onFreeMode
}: {
    onSelect: (boatId: number) => void;
    onFreeMode: () => void
}) {
    const { context } = useFrame()
    const fid = context?.user.fid

    const handleSelect = async (boat: BoatOption) => {
        if (!fid) return
        const level = boat.id === 'boat1' ? 1 : boat.id === 'boat2' ? 2 : 3
        try {
            await api.saveUser({ fid, activeBoatLevel: level })
            onSelect(level)
        } catch (e) { console.error(e) }
    }

    const handleFreeMode = async () => {
        if (!fid) return
        try {
            await api.saveUser({ fid, activeBoatLevel: 0 })
            onFreeMode()
        } catch (e) { console.error(e) }
    }
    return (
        <div className="flex flex-col items-center justify-center p-6 space-y-8 animate-fade-in max-w-sm mx-auto min-h-screen bg-hex-pattern">
            <div className="text-center space-y-2 bg-[#0c4a6e]/80 p-6 rounded-[2.5rem] border-2 border-[#0ea5e9]/50 backdrop-blur-md shadow-2xl">
                <h2 className="text-4xl font-black text-white italic tracking-tighter drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)]">CHOOSE YOUR MODE</h2>
                <p className="text-cyan-300 text-[10px] uppercase font-black tracking-[0.3em] opacity-80">Gate Verification Required</p>
            </div>

            <div className="grid grid-cols-1 gap-4 w-full">
                {BOATS.map((boat) => (
                    <button
                        key={boat.id}
                        onClick={() => handleSelect(boat)}
                        className={`group relative flex flex-col p-6 bg-[#1e293b]/90 border-b-8 border-[#0c4a6e] hover:border-b-4 hover:translate-y-1 rounded-[2rem] transition-all shadow-2xl overflow-hidden`}
                    >
                        <div className="flex justify-between items-center z-10 w-full">
                            <div className="text-left">
                                <p className="text-white font-black text-xl uppercase italic tracking-tighter leading-none mb-2">{boat.name}</p>
                                <div className="flex gap-2">
                                    <span className={`text-[10px] font-black text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-full border border-cyan-400/20`}>
                                        {boat.rate} FISH/HR
                                    </span>
                                </div>
                            </div>
                            <div className={`bg-[#FDE047] text-black px-5 py-2 rounded-2xl font-black shadow-lg border-b-4 border-[#A16207]`}>
                                ${boat.price}
                            </div>
                        </div>
                        {/* Visual Icon */}
                        <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-125 transition-transform">
                            <span className="text-7xl">
                                {boat.id === 'boat1' ? '🚤' : boat.id === 'boat2' ? '🚢' : '🛳️'}
                            </span>
                        </div>
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
        </div>
    )
}
