'use client'

import React from 'react'
import AutoCaster from './AutoCaster'

export function FishingGame({
  activeBoatLevel = 0,
  currentRate = 0,
  isMuted = false
}: {
  activeBoatLevel: number
  currentRate: number
  isMuted?: boolean
}) {
  return (
    <div className="relative w-full h-full min-h-[350px] bg-sky-900/10 overflow-hidden rounded-[2.5rem]">
      {/* Visual Animation */}
      <AutoCaster />

      {/* Rarity Info Dashboard (Floating) */}
      <div className="absolute top-4 left-4 z-30 flex flex-col gap-1">
        <p className="text-[8px] text-gray-500 uppercase font-black tracking-widest mb-1 shadow-sm">ACTIVE BOAT</p>
        <div className="flex items-center gap-2 bg-[#001226]/90 backdrop-blur-xl px-4 py-3 rounded-[1.5rem] border border-white/5 shadow-2xl">
          <span className="text-2xl drop-shadow-lg">
            {activeBoatLevel === 0 ? '🛶' : activeBoatLevel === 1 ? '🚤' : activeBoatLevel === 2 ? '🚢' : '🛳️'}
          </span>
          <div className="flex flex-col">
            <p className="text-[10px] text-white font-black uppercase italic tracking-tighter leading-none mb-1">
              {activeBoatLevel === 0 ? 'Basic Raft' : activeBoatLevel === 1 ? 'Rookie Raft' : activeBoatLevel === 2 ? 'Coastal Cruiser' : 'Hunter Vessel'}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              <p className="text-[9px] text-cyan-400 font-mono font-bold uppercase tracking-widest">
                {currentRate.toFixed(2)} FISH/HR
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Ambient VFX */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-cyan-500/10 to-transparent"></div>
        <div className="absolute top-0 right-0 p-6 opacity-30">
          <div className="w-24 h-1 bg-white/20 rounded-full blur-md animate-pulse"></div>
        </div>
      </div>

      {/* Decorative Wave Overlay */}
      <div className="absolute bottom-0 left-0 w-full h-4 bg-white/5 backdrop-blur-sm animate-wave"></div>
    </div>
  )
}
