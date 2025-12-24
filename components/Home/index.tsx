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
import MiningController, { FishCatch } from '../Fishing/MiningController';
import BoosterPanel from '../Fishing/BoosterPanel';
import GlobalStats from './GlobalStats';

export function Demo({ initialBoat }: { initialBoat?: any }) {
  const { context } = useFrame()
  const { address } = useAccount()
  const fid = context?.user.fid

  // Mining & Boat State
  const [minedFish, setMinedFish] = useState(0)
  const [onlineMiners, setOnlineMiners] = useState(1)
  const [rodLevel, setRodLevel] = useState(1) // Legacy rod
  const [activeBoatLevel, setActiveBoatLevel] = useState(initialBoat?.id === 'free' ? 0 : (initialBoat?.price === 10 ? 1 : initialBoat?.price === 20 ? 2 : initialBoat?.price === 50 ? 3 : 0))
  const [fishCap, setFishCap] = useState(initialBoat?.rate || 0)
  const [boosterExpiry, setBoosterExpiry] = useState(0) // Timestamp
  const [xp, setXp] = useState(0)
  const [spinTickets, setSpinTickets] = useState(0)
  const [lastDailySpin, setLastDailySpin] = useState(0)

  // Settings
  const [volumeOn, setVolumeOn] = useState(true)
  const [announceOn, setAnnounceOn] = useState(true)

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

  // Settings Persistence
  useEffect(() => {
    const vol = localStorage.getItem('bf_volume')
    const ann = localStorage.getItem('bf_announce')
    if (vol !== null) setVolumeOn(vol === 'true')
    if (ann !== null) setAnnounceOn(ann === 'true')
  }, [])

  useEffect(() => {
    localStorage.setItem('bf_volume', volumeOn.toString())
    localStorage.setItem('bf_announce', announceOn.toString())
  }, [volumeOn, announceOn])

  const handleCatch = useCallback((catchData: FishCatch) => {
    setMinedFish(prev => prev + catchData.value)
    setXp(prev => prev + 25)
    if (announceOn) {
      console.log(`Caught ${catchData.rarity}! +${catchData.value} fish`)
    }
  }, [announceOn])

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
          setActiveBoatLevel(prev => savedBoat || prev)
          setFishCap(prev => {
            if (savedBoat === 1) return 10
            if (savedBoat === 2) return 25
            if (savedBoat === 3) return 60
            return prev
          })
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

      {/* Anti-Abuse Mining Controller (Headless) */}
      <MiningController
        fishCapPerHour={fishCap}
        speedMultiplier={Date.now() < boosterExpiry ? 1.05 : 1.0} // Simulation of booster effect on speed
        onCatch={handleCatch}
        isActive={true}
      />

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

      {/* NEW Header with Toggles */}
      <div className="w-full max-w-md px-4 flex justify-between items-center bg-[#001226]/50 p-2 rounded-2xl border border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center text-sm">🎣</div>
          <span className="font-black text-xs tracking-tighter">BASE FISHING</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setVolumeOn(!volumeOn)}
            className={`p-2 rounded-xl transition-all ${volumeOn ? 'text-cyan-400 bg-cyan-400/10' : 'text-gray-600 bg-white/5'}`}
          >
            {volumeOn ? '🔊' : '🔇'}
          </button>
          <button
            onClick={() => setAnnounceOn(!announceOn)}
            className={`p-2 rounded-xl transition-all ${announceOn ? 'text-purple-400 bg-purple-400/10' : 'text-gray-600 bg-white/5'}`}
          >
            {announceOn ? '🔔' : '🔕'}
          </button>
          <button className="p-2 text-gray-400 hover:text-white transition-colors">⋮</button>
        </div>
      </div>

      {/* Balance Bar */}
      <div className="w-full max-w-md px-4 pt-2">
        <div className="bg-[#001226]/90 p-4 rounded-[2rem] border border-white/5 flex justify-between items-center shadow-2xl backdrop-blur-xl">
          <div>
            <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest pl-1">Can Fish Balance</p>
            <div className="flex items-baseline gap-1">
              <p className="text-3xl font-mono text-cyan-400 font-bold">{minedFish.toFixed(2)}</p>
              <span className="text-[10px] text-cyan-800 font-bold uppercase">Fish</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsSwapOpen(true)} className="w-12 h-12 flex items-center justify-center bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/40 rounded-2xl transition-all">💸</button>
            <button onClick={() => setIsSpinOpen(true)} className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all border ${canSpinDaily ? 'bg-yellow-500 text-black border-yellow-400' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/40'}`}>🎡</button>
          </div>
        </div>
      </div>

      {/* Main Game Screen */}
      <div className="w-full max-w-md px-4 flex gap-4">
        {/* Left Side: Auto Caster */}
        <div className="flex-1 bg-black/20 rounded-[2.5rem] border border-white/5 relative overflow-hidden min-h-[350px]">
          <FishingGame
            activeBoatLevel={activeBoatLevel}
            currentRate={total}
            isMuted={!volumeOn}
          />
        </div>

        {/* Right Side: Boosters */}
        <div className="w-24 flex flex-col gap-2">
          <BoosterPanel
            onBuyBooster={(type) => handleBuyBooster()} // Simplified for now
            isBoosterActive={Date.now() < boosterExpiry}
            isTurboActive={false}
          />
        </div>
      </div>

      <GlobalStats />

    </div>
  )

}

