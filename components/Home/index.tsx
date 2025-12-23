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
  const [spinTickets, setSpinTickets] = useState(0) // Inventory Tickets (Level Up / Referrals)
  const [lastDailySpin, setLastDailySpin] = useState(0) // Timestamp of last daily usage

  // Referral State
  const [referralCount, setReferralCount] = useState(0)
  const [invitees, setInvitees] = useState<string[]>([])
  const [hasClaimed3Ref, setHasClaimed3Ref] = useState(false)

  const BASE_RATE = 60

  // Derived Level (User requested /500 XP to level up)
  const currentLevel = Math.floor(xp / 500) + 1
  const xpForNextLevel = 500 - (xp % 500)

  // Daily Spin Logic
  const canSpinDaily = (Date.now() - lastDailySpin) > (24 * 60 * 60 * 1000)
  // Total available spins = inventory tickets + 1 if daily is ready
  const totalSpinsAvailable = spinTickets + (canSpinDaily ? 1 : 0)

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
          const savedTickets = parseInt(data.spinTickets || '0') // Inventory only
          const savedLastDaily = parseInt(data.lastDailySpin || '0')
          const savedRefs = parseInt(data.referralCount || '0')
          const savedInvitees = data.invitees || []
          const savedLastSeen = parseInt(data.lastSeen || Date.now().toString())

          setRodLevel(savedRod)
          setXp(savedXp)
          setSpinTickets(savedTickets)
          setLastDailySpin(savedLastDaily)
          setReferralCount(savedRefs)
          setInvitees(savedInvitees)

          if (savedRefs >= 3) setHasClaimed3Ref(true)

          // Referral Context Check (Invite Link)
          const urlParams = new URLSearchParams(window.location.search)
          const refParam = urlParams.get('ref')

          // Offline Calculation
          const nowForOffline = Date.now()
          const timeDiff = (nowForOffline - savedLastSeen) / 1000

          let rodBonus = 0
          if (savedRod === 5) rodBonus = 59
          else if (savedRod === 2) rodBonus = 30
          else rodBonus = 10

          let refBooster = 0
          if (savedRefs >= 100) refBooster = 100

          const offlineFish = ((60 + rodBonus + refBooster) / 3600) * timeDiff
          setMinedFish(savedFish + offlineFish)

          // Initial Save to register referral if present
          if (refParam && refParam !== fid.toString()) {
            await fetch('/api/user', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fid,
                minedFish: savedFish + offlineFish,
                rodLevel: savedRod,
                xp: savedXp,
                spinTickets: savedTickets,
                lastDailySpin: savedLastDaily,
                referrerFid: refParam
              })
            })
          }
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
            lastDailySpin: lastDailySpin,
            referralCount: referralCount,
            walletAddress: address
          })
        })
        console.log("Auto-saved to Redis")
      } catch (e) { console.error("Save error", e) }
    }, 15000)

    return () => clearInterval(interval)
  }, [fid, address, spinTickets, lastDailySpin, referralCount])

  // Mining Simulation Loop
  useEffect(() => {
    // Randomize miners every 10 seconds (simulating network activity)
    const minerInterval = setInterval(() => {
      setOnlineMiners(Math.floor(Math.random() * 10) + 1)
    }, 10000)

    // Mining Loop (Tick every 1s)
    const miningInterval = setInterval(() => {
      const currentLv = Math.floor(xpRef.current / 500) + 1
      if (currentLv < 5) return // LOCKED if under level 5

      const minerPenalty = Math.max(0, onlineMiners - 1)
      const currentBaseRate = Math.max(0, BASE_RATE - minerPenalty)

      let rodBonus = 0
      if (rodLevel === 5) rodBonus = 59
      else if (rodLevel === 2) rodBonus = 30
      else rodBonus = 10

      // Referral Booster
      let refBonus = 0
      if (referralCount >= 100) refBonus = 100 // +100 Fish/Hr for whales

      const totalRatePerHour = currentBaseRate + rodBonus + refBonus
      const fishPerSecond = totalRatePerHour / 3600

      setMinedFish(prev => prev + fishPerSecond)
    }, 1000)

    return () => {
      clearInterval(minerInterval)
      clearInterval(miningInterval)
    }
  }, [onlineMiners, rodLevel, referralCount])

  const handleSwap = async (amount: number) => {
    // ... same as before
    if (!fid || !address) {
      alert("Please connect wallet first")
      return
    }

    try {
      setMinedFish(prev => Math.max(0, prev - amount))
      setIsSwapOpen(false)

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
        minedFishRef.current -= amount
        await fetch('/api/user', {
          method: 'POST',
          body: JSON.stringify({
            fid,
            minedFish: minedFishRef.current,
            walletAddress: address
          })
        }) // simple partial save 
        alert(`Withdraw Request Sent! ID: ${data.id}`)
      } else {
        alert("Withdraw failed: " + data.error)
      }
    } catch (e) {
      console.error("Swap Error", e)
      alert("Transaction Failed")
    }
  }

  const handleLevelUp = (newLevel: number) => {
    setRodLevel(newLevel)
    setSpinTickets(prev => prev + 1) // Level Up Reward
    // If user has 100+ referrals, maybe give extra? for now sticking to basic request
  }

  const handleSpinWin = (amount: number) => {
    setMinedFish(prev => prev + amount)

    // Logic: Use Daily first if available
    const canSpinDailyNow = (Date.now() - lastDailySpin) > (24 * 60 * 60 * 1000)

    if (canSpinDailyNow) {
      setLastDailySpin(Date.now()) // Mark daily used NOW
      // Do NOT consume inventory ticket
    } else {
      setSpinTickets(prev => Math.max(0, prev - 1)) // Consume inventory
    }
  }

  // Debug/Simulate Referral
  const simulateReferral = () => {
    const newCount = referralCount + 1
    setReferralCount(newCount)

    // Bonus Logic
    if (newCount === 3 && !hasClaimed3Ref) {
      setSpinTickets(prev => prev + 1)
      setHasClaimed3Ref(true)
      alert("Referral Bonus: +1 Ticket for 3 Friends!")
    }

    if (newCount === 100) {
      alert("Whale Status! Unlocked: Mining Booster + Special Spin!")
      // Maybe give a special ticket?
      setSpinTickets(prev => prev + 1)
    }
  }

  // Helper for UI
  const getMiningStats = () => {
    const penalty = Math.max(0, onlineMiners - 1)
    const currentBase = Math.max(0, BASE_RATE - penalty)
    let bonus = 0
    if (rodLevel === 5) bonus = 59
    else if (rodLevel === 2) bonus = 30
    else bonus = 10

    let refBonus = 0
    if (referralCount >= 100) refBonus = 100

    return { currentBase, bonus, refBonus, total: currentBase + bonus + refBonus }
  }

  const { currentBase, bonus, refBonus, total } = getMiningStats()

  return (
    <div className="flex min-h-screen flex-col items-center justify-start py-6 space-y-6 bg-[#000814]">

      <SwapMenu
        isOpen={isSwapOpen}
        onClose={() => setIsSwapOpen(false)}
        minedFish={minedFish}
        onSwap={handleSwap}
      />

      <SpinMenu
        isOpen={isSpinOpen}
        onClose={() => setIsSpinOpen(false)}
        tickets={totalSpinsAvailable} // Show Total Available
        canSpinDaily={canSpinDaily} // Pass info
        nextDailySpin={lastDailySpin + (24 * 3600 * 1000)}
        onSpinSuccess={handleSpinWin}
      />

      {/* Game Header */}
      <div className="w-full max-w-md px-4 text-center space-y-1">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 tracking-tighter drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
          CYBER FISHING
        </h1>
        <p className="text-xs text-[#A3B3C2] uppercase tracking-[0.2em] animate-pulse">
          Play to Earn Season 1
        </p>
      </div>

      {/* Mining Dashboard (New Location) */}
      <div className="w-full max-w-md px-4 space-y-4">
        <div className="bg-[#001226]/80 p-3 rounded-xl border border-[#F472B6]/30 shadow-lg backdrop-blur-sm flex flex-col justify-between">
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
                className={`w-full py-2 text-[10px] uppercase font-bold border rounded transition-colors ${canSpinDaily ? 'bg-yellow-500 text-black border-yellow-400 hover:bg-yellow-400 animate-pulse' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/50'
                  }`}
              >
                Lucky Spin ({totalSpinsAvailable}🎟️)
              </button>
            </div>
          </div>
        </div>

        {/* Mining Status - Locked if Level < 5 */}
        {currentLevel < 5 ? (
          <div className="p-4 bg-[#001226]/80 rounded-xl border border-yellow-500/30 text-center animate-pulse">
            <p className="text-yellow-400 font-bold uppercase tracking-widest text-sm mb-2">🔒 Auto-Mining Locked</p>
            <p className="text-gray-400 text-xs text-center mb-2">Reach <span className="text-white font-bold">Level 5</span> to unlock.</p>
            <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden relative">
              <div
                className="bg-yellow-500 h-full transition-all duration-500"
                style={{ width: `${((xp % 500) / 500) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center mt-1 px-1">
              <p className="text-[10px] text-gray-500">Lvl {currentLevel}</p>
              <p className="text-[10px] text-yellow-500/80 font-mono">{xp % 500}/500 XP</p>
            </div>
          </div>
        ) : (
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
              {refBonus > 0 && (
                <div className="flex justify-between text-xs text-purple-200">
                  <span>Ref Booster:</span>
                  <span className="font-mono">+{refBonus}/hr</span>
                </div>
              )}
              <div className="h-[1px] bg-white/10 my-1"></div>
              <div className="flex justify-between text-sm font-bold text-white">
                <span>Total:</span>
                <span className="font-mono">{total}/hr</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Game Canvas - FULL WIDTH */}
      <div className="w-full">
        <FishingGame
          onCatch={(xpGained) => setXp(prev => prev + xpGained)}
          currentLevel={currentLevel}
          xpForNext={xpForNextLevel}
        />
      </div>

      {/* Dashboard/Tools and Referrals */}
      <div className="w-full max-w-md px-4 space-y-4">

        {/* Referrals Section - ENHANCED */}
        <div className="p-4 rounded-xl bg-[#001226]/50 border border-purple-500/20">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider">Referrals</h3>
            <span className="text-xl font-mono text-white">{referralCount}</span>
          </div>

          <div className="space-y-2 text-[10px] text-gray-400 mb-4">
            <p className={referralCount >= 3 ? 'text-green-400' : ''}>• 3 Friends = 1 Free Ticket {hasClaimed3Ref && '✅'}</p>
            <p className={referralCount >= 100 ? 'text-green-400' : ''}>• 100 Friends = Mining Booster {referralCount >= 100 && '🚀'}</p>
          </div>

          <div className="bg-black/40 p-2 rounded border border-white/10 mb-3 overflow-hidden">
            <p className="text-[8px] text-gray-500 uppercase mb-1">Your Invite Link:</p>
            <p className="text-[10px] font-mono text-purple-300 break-all select-all">
              {typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}/?ref=${fid}` : ''}
            </p>
          </div>

          <div className="mt-4 border-t border-white/5 pt-3">
            <p className="text-[8px] text-gray-500 uppercase mb-2 flex justify-between">
              <span>Invited Users ({invitees.length})</span>
              <span className="text-purple-400/50">Linked Status</span>
            </p>
            <div className="flex flex-col gap-1 max-h-32 overflow-y-auto pr-1">
              {invitees.length > 0 ? (
                invitees.map((inviteeId) => (
                  <div key={inviteeId} className="flex justify-between items-center p-2 bg-purple-500/5 border border-purple-500/10 rounded">
                    <span className="text-[10px] text-purple-200 font-mono">FID: {inviteeId}</span>
                    <span className="text-[10px] text-green-500/50 font-bold uppercase tracking-tighter">Active</span>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-gray-600 italic text-center py-2">No friends invited yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#001226]/50 border border-[#0A5CDD]/20">
          <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Player Control</h3>
          <WalletActions />
        </div>
      </div>

      {/* Shop Section */}
      <div className="w-full max-w-md px-4">
        {currentLevel < 5 ? (
          <div className="p-6 text-center opacity-50 grayscale pb-20">
            <p className="text-gray-500 text-sm">Shop is locked until Level 5</p>
          </div>
        ) : (
          <BoatShop currentLevel={rodLevel} onPurchaseSuccess={handleLevelUp} />
        )}
      </div>
    </div>
  )
}

