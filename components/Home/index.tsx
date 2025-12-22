'use client'

import { useState, useEffect } from 'react'
import { FarcasterActions } from '@/components/Home/FarcasterActions'
import { User } from '@/components/Home/User'
import { WalletActions } from '@/components/Home/WalletActions'
import { NotificationActions } from './NotificationActions'
import { BoatShop } from '@/components/Shop/BoatShop'
import { FishingGame } from '../Fishing/FishingGame'
import { SwapMenu } from '@/components/Swap/SwapMenu'

export function Demo() {
  // Mining State
  const [minedFish, setMinedFish] = useState(0)
  const [onlineMiners, setOnlineMiners] = useState(1) // Starts with just user
  const [rodLevel, setRodLevel] = useState(1) // Default Level 1 (+10)
  const BASE_RATE = 60

  // Swap Menu
  const [isSwapOpen, setIsSwapOpen] = useState(false)

  // Mining Simulation Loop
  useEffect(() => {
    // Randomize miners every 10 seconds (simulating network activity)
    const minerInterval = setInterval(() => {
      setOnlineMiners(Math.floor(Math.random() * 10) + 1)
    }, 10000)

    // Mining Loop (Tick every 1s)
    const miningInterval = setInterval(() => {
      const minerPenalty = Math.max(0, onlineMiners - 1)
      const currentBaseRate = Math.max(0, BASE_RATE - minerPenalty)

      let rodBonus = 0
      if (rodLevel === 5) rodBonus = 59
      else if (rodLevel === 2) rodBonus = 30
      else rodBonus = 10

      const totalRatePerHour = currentBaseRate + rodBonus
      const fishPerSecond = totalRatePerHour / 3600

      setMinedFish(prev => prev + fishPerSecond)
    }, 1000)

    return () => {
      clearInterval(minerInterval)
      clearInterval(miningInterval)
    }
  }, [onlineMiners, rodLevel])

  const handleSwap = (amount: number) => {
    setMinedFish(prev => Math.max(0, prev - amount))
    setIsSwapOpen(false)
  }

  // Helper for UI
  const getMiningStats = () => {
    const penalty = Math.max(0, onlineMiners - 1)
    const currentBase = Math.max(0, BASE_RATE - penalty)
    let bonus = 0
    if (rodLevel === 5) bonus = 59
    else if (rodLevel === 2) bonus = 30
    else bonus = 10
    return { currentBase, bonus, total: currentBase + bonus }
  }

  const { currentBase, bonus, total } = getMiningStats()

  return (
    <div className="flex min-h-screen flex-col items-center justify-start p-4 space-y-6 bg-[#000814]">

      <SwapMenu
        isOpen={isSwapOpen}
        onClose={() => setIsSwapOpen(false)}
        minedFish={minedFish}
        onSwap={handleSwap}
      />

      {/* Game Header */}
      <div className="w-full max-w-md text-center space-y-1">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 tracking-tighter drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
          CYBER FISHING
        </h1>
        <p className="text-xs text-[#A3B3C2] uppercase tracking-[0.2em] animate-pulse">
          Play to Earn Season 1
        </p>
      </div>

      {/* Mining Dashboard (New Location) */}
      <div className="w-full max-w-md grid grid-cols-2 gap-4">
        {/* Status Box */}
        <div className="bg-[#001226]/80 p-3 rounded-xl border border-[#0A5CDD]/30 shadow-lg backdrop-blur-sm">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <span>⛏️</span> Mining Status
          </p>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-blue-200">
              <span>Miners:</span>
              <span className="font-mono text-white">{onlineMiners}</span>
            </div>
            <div className="flex justify-between text-xs text-green-200">
              <span>Base Rate:</span>
              <span className="font-mono">{currentBase}/hr</span>
            </div>
            <div className="flex justify-between text-xs text-yellow-200">
              <span>Rod Bonus:</span>
              <span className="font-mono">+{bonus}/hr</span>
            </div>
            <div className="h-[1px] bg-white/10 my-1"></div>
            <div className="flex justify-between text-sm font-bold text-white">
              <span>Total:</span>
              <span className="font-mono">{total}/hr</span>
            </div>
          </div>
        </div>

        {/* Mined Fish Box */}
        <div className="bg-[#001226]/80 p-3 rounded-xl border border-[#F472B6]/30 shadow-lg backdrop-blur-sm flex flex-col justify-between">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <span>🎁</span> Mined Fish
          </p>
          <div className="flex flex-col gap-2">
            <p className="text-2xl font-mono text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-bold truncate">
              {minedFish.toFixed(4)}
            </p>
            <button
              onClick={() => setIsSwapOpen(true)}
              className="w-full py-1.5 text-[10px] uppercase font-bold bg-green-500/10 text-green-400 border border-green-500/50 rounded hover:bg-green-500/20 transition-colors"
            >
              Swap to USDC
            </button>
          </div>
        </div>
      </div>

      {/* Main Game Canvas */}
      <div className="w-full max-w-md">
        <FishingGame />
      </div>

      {/* Dashboard/Tools */}
      <div className="w-full max-w-md space-y-4">
        <div className="p-4 rounded-xl bg-[#001226]/50 border border-[#0A5CDD]/20">
          <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Player Control</h3>
          <WalletActions />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-[#001226]/50 border border-[#0A5CDD]/20">
            <h3 className="text-xs font-bold text-gray-500 mb-2">IDENTITY</h3>
            <User />
          </div>
          <div className="p-4 rounded-xl bg-[#001226]/50 border border-[#0A5CDD]/20">
            <h3 className="text-xs font-bold text-gray-500 mb-2">ACTIONS</h3>
            <FarcasterActions />
            <div className="mt-2">
              <NotificationActions />
            </div>
          </div>
        </div>
      </div>

      {/* Shop Section */}
      <div className="w-full max-w-md">
        <BoatShop />
      </div>
    </div>
  )
}
