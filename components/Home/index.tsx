'use client'

import { FarcasterActions } from '@/components/Home/FarcasterActions'
import { User } from '@/components/Home/User'
import { WalletActions } from '@/components/Home/WalletActions'
import { NotificationActions } from './NotificationActions'
import { BoatShop } from '@/components/Shop/BoatShop'
import { FishingGame } from '../Fishing/FishingGame'

export function Demo() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-start p-4 space-y-6 bg-[#000814]">

      {/* Game Header */}
      <div className="w-full max-w-md text-center space-y-1">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 tracking-tighter drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
          CYBER FISHING
        </h1>
        <p className="text-xs text-[#A3B3C2] uppercase tracking-[0.2em] animate-pulse">
          Play to Earn Season 1
        </p>
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

        <div className="grid grid-cols-2 gap-4">
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
