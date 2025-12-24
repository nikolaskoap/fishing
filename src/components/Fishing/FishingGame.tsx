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
    <div className="relative w-full h-full min-h-[400px] overflow-hidden">
      {/* Visual Animation */}
      <AutoCaster />

      {/* Ambient VFX */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#0ea5e9]/20 to-transparent"></div>
        <div className="absolute top-0 right-0 p-12 opacity-40">
          <div className="w-32 h-1 bg-white/30 rounded-full blur-xl animate-pulse"></div>
        </div>
      </div>

      {/* Decorative Wave Overlay */}
      <div className="absolute bottom-0 left-0 w-full h-8 bg-white/10 backdrop-blur-sm animate-wave"></div>
    </div>
  )
}
