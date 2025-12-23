'use client'


import { useState, useEffect, useRef } from 'react'
import { BoatShop } from '@/components/Shop/BoatShop'
import { WalletActions } from '@/components/Home/WalletActions'
import { FishingGame } from '../Fishing/FishingGame'
import { SwapMenu } from '@/components/Swap/SwapMenu'
import { SpinMenu } from '@/components/Home/SpinMenu'
import { useFrame } from '@/components/farcaster-provider'
import { useAccount, useWriteContract } from 'wagmi'
import { parseUnits } from 'viem'
import { USDT_ADDRESS, PAYMENT_RECIPIENT, ERC20_ABI } from "@/lib/contracts";

export function Demo() {
  const { context } = useFrame()
  const { address } = useAccount()
  const fid = context?.user.fid

  // Mining & Boat State
  const [minedFish, setMinedFish] = useState(0)
  const [onlineMiners, setOnlineMiners] = useState(1)
  const [rodLevel, setRodLevel] = useState(1) // Legacy rod
  const [activeBoatLevel, setActiveBoatLevel] = useState(0) // 0: None, 1: $10, 2: $20, 3: $50
  const [boosterExpiry, setBoosterExpiry] = useState(0) // Timestamp
  const [xp, setXp] = useState(0)
  const [spinTickets, setSpinTickets] = useState(0)
  const [lastDailySpin, setLastDailySpin] = useState(0)

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
  const boatRef = useRef(0)
  const boosterRef = useRef(0)
  const xpRef = useRef(xp)

  // Update refs when state changes
  useEffect(() => {
    minedFishRef.current = minedFish
    boatRef.current = activeBoatLevel
    boosterRef.current = boosterExpiry
    xpRef.current = xp
  }, [minedFish, activeBoatLevel, boosterExpiry, xp])

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
          const savedBoat = parseInt(data.activeBoatLevel || '0')
          const savedBooster = parseInt(data.boosterExpiry || '0')
          const savedXp = parseInt(data.xp || '0')
          const savedTickets = parseInt(data.spinTickets || '0')
          const savedLastDaily = parseInt(data.lastDailySpin || '0')
          const savedRefs = parseInt(data.referralCount || '0')
          const savedInvitees = data.invitees || []
          const savedLastSeen = parseInt(data.lastSeen || Date.now().toString())

          setRodLevel(savedRod)
          setActiveBoatLevel(savedBoat)
          setBoosterExpiry(savedBooster)
          setXp(savedXp)
          setSpinTickets(savedTickets)
          setLastDailySpin(savedLastDaily)
          setReferralCount(savedRefs)
          setInvitees(savedInvitees)

          if (savedRefs >= 3) setHasClaimed3Ref(true)

          const urlParams = new URLSearchParams(window.location.search)
          const refParam = urlParams.get('ref')

          // Offline Calculation
          const nowForOffline = Date.now()
          const timeDiff = (nowForOffline - savedLastSeen) / 1000

          let rate = 0
          if (savedBoat === 1) rate = 10
          else if (savedBoat === 2) rate = 25
          else if (savedBoat === 3) rate = 60

          if (nowForOffline < savedBooster) rate *= 1.5
          if (savedRefs >= 100) rate += 10

          const offlineFish = (rate / 3600) * timeDiff
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
            activeBoatLevel: boatRef.current,
            boosterExpiry: boosterRef.current,
            rodLevel: rodLevel,
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
      let rate = 0
      if (boatRef.current === 1) rate = 10
      else if (boatRef.current === 2) rate = 25
      else if (boatRef.current === 3) rate = 60

      if (Date.now() < boosterRef.current) rate *= 1.5
      if (referralCount >= 100) rate += 10

      const fishPerSecond = rate / 3600
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
    const canSpinDailyNow = (Date.now() - lastDailySpin) > (24 * 60 * 60 * 1000)
    if (canSpinDailyNow) {
      setLastDailySpin(Date.now())
    } else {
      setSpinTickets(prev => Math.max(0, prev - 1))
    }
  }

  // Payment Handlers (Boats / Boosters)
  const { writeContract } = useWriteContract()

  const handleSelectBoat = (level: number, price: number) => {
    if (!address) {
      alert("Please connect wallet")
      return
    }
    try {
      writeContract({
        address: USDT_ADDRESS,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [PAYMENT_RECIPIENT, parseUnits(price.toString(), 6)],
      })
      setActiveBoatLevel(level)
      alert(`Transaction for vessel initiated! (Wait for success)`)
    } catch (e) {
      console.error(e)
      alert("Transaction Failed")
    }
  }

  const handleBuyBooster = () => {
    if (!address) return
    try {
      writeContract({
        address: USDT_ADDRESS,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [PAYMENT_RECIPIENT, parseUnits("5", 6)],
      })
      setBoosterExpiry(Date.now() + (60 * 60 * 1000))
      alert("Booster Purchased! +50% Yield for 1 Hour.")
    } catch (e) {
      console.error(e)
      alert("Transaction Failed")
    }
  }

  const handleCatchFish = (amount: number, xpGained: number) => {
    setMinedFish(prev => prev + amount)
    setXp(prev => prev + xpGained)
  }

  // Calculate current effective rate
  const getMiningStats = () => {
    let rate = 0
    if (activeBoatLevel === 1) rate = 10
    else if (activeBoatLevel === 2) rate = 25
    else if (activeBoatLevel === 3) rate = 60

    let boosterMult = 1.0
    if (Date.now() < boosterExpiry) boosterMult = 1.5

    let refBonusValue = 0
    if (referralCount >= 100) refBonusValue = 10

    const total = (rate * boosterMult) + refBonusValue
    return { total }
  }

  const { total } = getMiningStats()

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
        tickets={totalSpinsAvailable}
        canSpinDaily={canSpinDaily}
        nextDailySpin={lastDailySpin + (24 * 3600 * 1000)}
        onSpinSuccess={handleSpinWin}
      />

      {/* Game Header */}
      <div className="w-full max-w-md px-4 text-center space-y-1">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 tracking-tighter drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
          CYBER FISHING
        </h1>
        <p className="text-xs text-[#A3B3C2] uppercase tracking-[0.2em] animate-pulse">
          S1: ABYSSAL WATERS
        </p>
      </div>

      {/* Balance Bar */}
      <div className="w-full max-w-md px-4">
        <div className="bg-[#001226]/90 p-3 rounded-2xl border border-white/5 flex justify-between items-center shadow-2xl backdrop-blur-xl">
          <div>
            <p className="text-[8px] text-gray-500 uppercase font-black tracking-widest pl-1">Total Mined</p>
            <div className="flex items-baseline gap-1">
              <p className="text-2xl font-mono text-cyan-400 font-bold">{minedFish.toFixed(4)}</p>
              <span className="text-[10px] text-cyan-800">FISH</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsSwapOpen(true)} className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/40 rounded-xl text-xs font-bold font-mono uppercase transition-all">Swap</button>
            <button onClick={() => setIsSpinOpen(true)} className={`px-4 py-2 rounded-xl text-xs font-bold font-mono uppercase transition-all border ${canSpinDaily ? 'bg-yellow-500 text-black border-yellow-400 animate-pulse' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/40'}`}>Spin</button>
          </div>
        </div>
      </div>

      {/* Main Game Canvas */}
      <div className="w-full">
        <FishingGame
          activeBoatLevel={activeBoatLevel}
          currentRate={total}
          onCatch={handleCatchFish}
          onSelectBoat={handleSelectBoat}
          onBuyBooster={handleBuyBooster}
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

