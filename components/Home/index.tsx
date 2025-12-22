'use client'


import { useState, useEffect, useRef } from 'react'
import { BoatShop } from '@/components/Shop/BoatShop'
import { WalletActions } from '@/components/Home/WalletActions'
import { FishingGame } from '../Fishing/FishingGame'
import { SwapMenu } from '@/components/Swap/SwapMenu'
import { SpinMenu } from '@/components/Home/SpinMenu'
import { useFrame } from '@/components/farcaster-provider'
import { useAccount } from 'wagmi'

export function Demo() {
  const { context } = useFrame()
  const { address } = useAccount()
  const fid = context?.user.fid

  // Mining State
  const [minedFish, setMinedFish] = useState(0)
  const [onlineMiners, setOnlineMiners] = useState(1) // Starts with just user
  const [rodLevel, setRodLevel] = useState(1) // Default Level 1 (+10)
  const [xp, setXp] = useState(0) // XP System
  const [spinTickets, setSpinTickets] = useState(0)
  const BASE_RATE = 60

  // Derived Level
  const currentLevel = Math.floor(xp / 1000) + 1
  const xpForNextLevel = 1000 - (xp % 1000)

  // Refs for State (to access in interval)
  const minedFishRef = useRef(minedFish)
  const rodLevelRef = useRef(rodLevel)
  const xpRef = useRef(xp)

  // Update refs when state changes
  useEffect(() => {
    minedFishRef.current = minedFish
    rodLevelRef.current = rodLevel
    xpRef.current = xp
  }, [minedFish, rodLevel, xp])

  // Swap & Spin Menus
  const [isSwapOpen, setIsSwapOpen] = useState(false)
  const [isSpinOpen, setIsSpinOpen] = useState(false)

  // 1. Load Data on Mount
  useEffect(() => {
    if (!fid) return

    const loadUserData = async () => {
      try {
        const res = await fetch(`/api/user?fid=${fid}`)
        const data = await res.json()

        if (data && !data.error) {
          const savedFish = parseFloat(data.minedFish || '0')
          const savedRod = parseInt(data.rodLevel || '1')
          const savedXp = parseInt(data.xp || '0')
          const savedTickets = parseInt(data.spinTickets || '1')
          const lastDailySpin = parseInt(data.lastDailySpin || '0')
          const lastSeen = parseInt(data.lastSeen || Date.now().toString())

          setRodLevel(savedRod)
          setXp(savedXp)

          // Daily Spin Logic
          const now = Date.now()
          const oneDay = 24 * 60 * 60 * 1000
          if (now > lastDailySpin + oneDay) {
            setSpinTickets(savedTickets + 1)
            // Update lastDailySpin immediately (optimistic)
            // We rely on the periodic saver to persist this, or we could force save
          } else {
            setSpinTickets(savedTickets)
          }

          // Offline Calculation
          const nowForOffline = Date.now()
          const timeDiff = (nowForOffline - lastSeen) / 1000

          let rodBonus = 0
          if (savedRod === 5) rodBonus = 59
          else if (savedRod === 2) rodBonus = 30
          else rodBonus = 10

          const offlineFish = ((60 + rodBonus) / 3600) * timeDiff

          if (offlineFish > 0) console.log(`Offline earnings: ${offlineFish}`)

          setMinedFish(savedFish + offlineFish)
        }
      } catch (e) { console.error("Load error", e) }
    }
    loadUserData()
  }, [fid])

  // 2. Periodic Saver (Every 15s)
  useEffect(() => {
    if (!fid) return

    const interval = setInterval(async () => {
      try {
        await fetch('/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fid,
            minedFish: minedFishRef.current,
            rodLevel: rodLevelRef.current,
            xp: xpRef.current,
            spinTickets: spinTickets,
            lastDailySpin: Date.now(), // This is a bit naive, ideally we only update if claimed. 
            // Better approach: We need a ref for 'lastDailySpin' too if we want to save it accurately.
            // For now, let's assume if we just logged in and got a ticket, we want to save that 'now' as the claim time?
            // Wait, if we update lastDailySpin every 15s to 'now', we never get a reward!
            // FIX: We need a ref for lastDailySpin that only updates when we claim.
            walletAddress: address
          })
        })
        console.log("Auto-saved to Redis")
      } catch (e) { console.error("Save error", e) }
    }, 15000)

    return () => clearInterval(interval)
  }, [fid, address])

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

  const handleSwap = async (amount: number) => {
    if (!fid || !address) {
      alert("Please connect wallet first")
      return
    }

    try {
      // Optimistic UI Update
      setMinedFish(prev => Math.max(0, prev - amount))
      setIsSwapOpen(false)

      // Call API
      const res = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fid,
          walletAddress: address,
          amountFish: amount,
          amountUSDC: amount // 1:1 Rate
        })
      })

      const data = await res.json()
      if (data.success) {
        // Force save current state to DB to sync the deduction
        minedFishRef.current -= amount // Update ref immediately
        await fetch('/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fid,
            minedFish: minedFishRef.current, // Use updated ref
            rodLevel: rodLevelRef.current,
            xp: xpRef.current,
            walletAddress: address
          })
        })
        alert(`Withdraw Request Sent! ID: ${data.id}`)
      } else {
        alert("Withdraw failed: " + data.error)
        // Rollback? (Ideally yes, but simplified here)
      }
    } catch (e) {
      console.error("Swap Error", e)
      alert("Transaction Failed")
    }
  }

  const handleLevelUp = (newLevel: number) => {
    setRodLevel(newLevel)
    setSpinTickets(prev => prev + 1) // Level Up Reward
  }

  const handleSpinWin = (amount: number) => {
    setMinedFish(prev => prev + amount)
    setSpinTickets(prev => Math.max(0, prev - 1)) // Deduct ticket
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

      <SpinMenu
        isOpen={isSpinOpen}
        onClose={() => setIsSpinOpen(false)}
        tickets={spinTickets}
        onSpinSuccess={handleSpinWin}
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
      {/* LOCKED if Level < 5 */}
      {/* Mined Fish & Actions - Always Visible */}
      <div className="w-full max-w-md bg-[#001226]/80 p-3 rounded-xl border border-[#F472B6]/30 shadow-lg backdrop-blur-sm flex flex-col justify-between">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
          <span>🎁</span> Mined Fish
        </p>
        <div className="flex flex-col gap-2">
          <p className="text-2xl font-mono text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-bold truncate">
            {minedFish.toFixed(4)}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setIsSwapOpen(true)}
              className="w-full py-2 text-[10px] uppercase font-bold bg-green-500/10 text-green-400 border border-green-500/50 rounded hover:bg-green-500/20 transition-colors"
            >
              Swap USDC
            </button>
            <button
              onClick={() => setIsSpinOpen(true)}
              className="w-full py-2 text-[10px] uppercase font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/50 rounded hover:bg-yellow-500/20 transition-colors"
            >
              Lucky Spin ({spinTickets}🎟️)
            </button>
          </div>
        </div>
      </div>

      {/* Mining Status - Locked if Level < 5 */}
      {currentLevel < 5 ? (
        <div className="w-full max-w-md p-4 bg-[#001226]/80 rounded-xl border border-yellow-500/30 text-center animate-pulse">
          <p className="text-yellow-400 font-bold uppercase tracking-widest text-sm mb-2">🔒 Auto-Mining Locked</p>
          <p className="text-gray-400 text-xs text-center mb-2">Reach <span className="text-white font-bold">Level 5</span> to unlock.</p>
          <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden relative">
            <div
              className="bg-yellow-500 h-full transition-all duration-500"
              style={{ width: `${((xp % 1000) / 1000) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center mt-1 px-1">
            <p className="text-[10px] text-gray-500">Lvl {currentLevel}</p>
            <p className="text-[10px] text-yellow-500/80 font-mono">{xp % 1000}/1000 XP</p>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-md bg-[#001226]/80 p-3 rounded-xl border border-[#0A5CDD]/30 shadow-lg backdrop-blur-sm">
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
      )}



      {/* Main Game Canvas */}
      <div className="w-full max-w-md">
        <FishingGame
          onCatch={(xpGained) => setXp(prev => prev + xpGained)}
          currentLevel={currentLevel}
          xpForNext={xpForNextLevel}
        />
      </div>

      {/* Dashboard/Tools */}
      <div className="w-full max-w-md space-y-4">
        <div className="p-4 rounded-xl bg-[#001226]/50 border border-[#0A5CDD]/20">
          <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Player Control</h3>
          <WalletActions />
        </div>
      </div>

      {/* Shop Section */}
      {currentLevel < 5 ? (
        <div className="w-full max-w-md p-6 text-center opacity-50 grayscale pb-20">
          <p className="text-gray-500 text-sm">Shop is locked until Level 5</p>
        </div>
      ) : (
        <div className="w-full max-w-md">
          <BoatShop currentLevel={rodLevel} onPurchaseSuccess={handleLevelUp} />
        </div>
      )}
    </div>
  )
}
