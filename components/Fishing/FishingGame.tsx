'use client'

import React from 'react'
import AutoCaster from './AutoCaster'

export function FishingGame({
  activeBoatLevel = 0,
  currentRate = 0,
  isMuted = false,
  isActive = false
}: {
  activeBoatLevel: number
  currentRate: number
  isMuted?: boolean
  isActive?: boolean
}) {
  return (
    <div className="relative w-full h-full min-h-[400px] overflow-hidden bg-gradient-to-b from-[#0ea5e9] via-[#0284c7] to-[#075985]">
      {/* Dynamic Sea Layers */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-full h-px bg-white/20 shadow-[0_0_20px_white]"></div>
        <div className="absolute top-1/3 right-0 w-1/2 h-px bg-white/10 shadow-[0_0_30px_white]"></div>
      </div>

      {/* Visual Animation (Rod/Physics) */}
      <AutoCaster isActive={isActive} />

      {/* Wave Layers */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden pointer-events-none h-32">
        {/* Layer 1 - Deep Water */}
        <div className="absolute bottom-0 left-0 w-[200%] h-full opacity-30 animate-wave-slow">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full fill-[#0c4a6e]">
            <path d="M0,60 C300,0 600,120 900,60 C1200,0 1500,120 1800,60 L1800,120 L0,120 Z" />
          </svg>
        </div>

        {/* Layer 2 - Mid Water */}
        <div className="absolute bottom-[-10px] left-[-50%] w-[200%] h-full opacity-50 animate-wave-medium">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full fill-[#0369a1]">
            <path d="M0,60 C300,120 600,0 900,60 C1200,120 1500,0 1800,60 L1800,120 L0,120 Z" />
          </svg>
        </div>

        {/* Layer 3 - Surface Foam */}
        <div className="absolute bottom-[-20px] left-0 w-[200%] h-full opacity-80 animate-wave-fast">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full fill-[#0ea5e9]/40">
            <path d="M0,60 C150,30 300,90 450,60 C600,30 750,90 900,60 C1050,30 1200,90 1350,60 L1350,120 L0,120 Z" />
          </svg>
        </div>
      </div>

      {/* Floating Sparkles */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 w-1 h-1 bg-white rounded-full animate-ping opacity-20"></div>
        <div className="absolute top-1/3 left-2/3 w-1 h-1 bg-white rounded-full animate-ping delay-700 opacity-20"></div>
        <div className="absolute top-2/3 left-1/2 w-1 h-1 bg-white rounded-full animate-ping delay-1000 opacity-20"></div>
      </div>
    </div>
  )
}
