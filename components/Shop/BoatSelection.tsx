'use client'

import React from 'react'

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
    onSelect: (boat: BoatOption) => void;
    onFreeMode: () => void
}) {
    return (
        <div className="flex flex-col items-center justify-center p-6 space-y-8 animate-fade-in max-w-sm mx-auto">
            <div className="text-center space-y-2">
                <h2 className="text-4xl font-black text-white italic tracking-tighter">CHOOSE YOUR MODE</h2>
                <p className="text-cyan-400 text-[10px] uppercase font-bold tracking-[0.3em]">Gate Verification Required</p>
            </div>

            <div className="grid grid-cols-1 gap-4 w-full">
                {BOATS.map((boat) => (
                    <button
                        key={boat.id}
                        onClick={() => onSelect(boat)}
                        className={`group relative flex flex-col p-5 bg-[#001226]/80 border border-${boat.color}-500/30 rounded-[2rem] hover:border-${boat.color}-400 transition-all hover:scale-[1.02] shadow-xl overflow-hidden`}
                    >
                        <div className="flex justify-between items-start z-10">
                            <div className="text-left">
                                <p className="text-white font-black text-xl uppercase italic">{boat.name}</p>
                                <div className="flex gap-2 mt-1">
                                    <span className={`text-[10px] font-bold text-${boat.color}-400 bg-${boat.color}-400/10 px-2 py-0.5 rounded-full`}>
                                        {boat.rate} FISH/HR
                                    </span>
                                    <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                                        +{boat.bonus}% BONUS
                                    </span>
                                </div>
                            </div>
                            <div className={`bg-${boat.color}-500 text-white px-4 py-2 rounded-2xl font-black shadow-lg`}>
                                ${boat.price}
                            </div>
                        </div>
                        {/* Visual Flair */}
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-${boat.color}-500 opacity-[0.05] rounded-full -translate-y-12 translate-x-12 blur-2xl group-hover:opacity-[0.15] transition-opacity`}></div>
                    </button>
                ))}

                <button
                    onClick={onFreeMode}
                    className="group flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-[2rem] hover:bg-white/10 transition-all text-left"
                >
                    <div>
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Free Mode</p>
                        <p className="text-[10px] text-gray-500">Practice only • No Mining • No Swap</p>
                    </div>
                    <span className="text-gray-500 font-bold px-3 py-1 rounded-full border border-white/10 text-xs">GRATIS</span>
                </button>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-gray-600">
                <span className="block w-2 h-2 rounded-full bg-cyan-500/40"></span>
                <span>Secure USDC payment via Warpcast</span>
            </div>
        </div>
    )
}
