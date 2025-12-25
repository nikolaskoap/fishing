'use client'

import React from 'react'

interface InventoryMenuProps {
    isOpen: boolean
    onClose: () => void
    rodLevel: number
    boatLevel: number
}

export function InventoryMenu({ isOpen, onClose, rodLevel, boatLevel }: InventoryMenuProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative w-full max-w-sm bg-[#0c4a6e] border-2 border-[#0ea5e9]/30 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden">
                <button onClick={onClose} className="absolute top-6 right-6 text-xl opacity-50 hover:opacity-100 transition-opacity">✕</button>

                <h2 className="text-2xl font-black italic text-white mb-8 tracking-tighter">INVENTORY</h2>

                <div className="grid grid-cols-2 gap-4">
                    <InventoryItem
                        icon="🎣"
                        name="FISHING ROD"
                        desc={`Level ${rodLevel}`}
                        rarity="COMMON"
                    />
                    <InventoryItem
                        icon={boatLevel === 1 ? '🚤' : boatLevel === 2 ? '🚢' : '🛳️'}
                        name="VESSEL"
                        desc={`Type ${boatLevel}`}
                        rarity="RARE"
                    />
                    <InventoryItem
                        icon="👞"
                        name="OLD BOOT"
                        desc="Common Junk"
                        rarity="JUNK"
                    />
                    <InventoryItem
                        icon="🥫"
                        name="TIN CAN"
                        desc="Recyclable"
                        rarity="JUNK"
                    />
                </div>

                <div className="mt-8 p-4 bg-black/20 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1">Equipped Booster</p>
                    <p className="text-sm font-bold text-white/60 italic">None Active</p>
                </div>
            </div>
        </div>
    )
}

function InventoryItem({ icon, name, desc, rarity }: { icon: string, name: string, desc: string, rarity: 'JUNK' | 'COMMON' | 'RARE' }) {
    const rarityColors = {
        JUNK: 'border-gray-500/30 bg-gray-500/10 text-gray-500',
        COMMON: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400',
        RARE: 'border-purple-500/30 bg-purple-500/10 text-purple-400'
    }

    return (
        <div className={`p-4 rounded-2xl border-2 ${rarityColors[rarity]} flex flex-col items-center text-center gap-1`}>
            <span className="text-3xl mb-1">{icon}</span>
            <p className="text-[10px] font-black uppercase tracking-tight">{name}</p>
            <p className="text-[8px] font-bold opacity-60 leading-none">{desc}</p>
        </div>
    )
}
