'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { BoatShop } from '@/components/Shop/BoatShop'
import { WalletActions } from '@/components/Home/WalletActions'
import { FishingGame } from '../Fishing/FishingGame'
import { SwapMenu } from '@/components/Swap/SwapMenu'
import { SpinMenu } from '@/components/Home/SpinMenu'
import { useFrame } from '@/components/farcaster-provider'
import { useAccount, useWriteContract } from 'wagmi'
import { parseUnits } from 'viem'
import { USDT_ADDRESS, PAYMENT_RECIPIENT, ERC20_ABI } from "@/lib/contracts";
import MiningController, { FishCatch, FishRarity } from '../Fishing/MiningController';
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

  // Bucket Persistence
  const [distributionBucket, setDistributionBucket] = useState<FishRarity[]>([])
  const [bucketIndex, setBucketIndex] = useState(0)
  const bucketRef = useRef<FishRarity[]>([])
  const indexRef = useRef(0)

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
    bucketRef.current = distributionBucket
    indexRef.current = bucketIndex
  }, [minedFish, activeBoatLevel, boosterExpiry, xp, distributionBucket, bucketIndex])

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
          const savedBucketRaw = data.distributionBucket
          const savedIndex = parseInt(data.currentIndex || '0')

          setRodLevel(savedRod)
          if (savedBucketRaw) {
            try {
              const parsed = JSON.parse(savedBucketRaw)
              setDistributionBucket(parsed)
              setBucketIndex(savedIndex)
            } catch (e) { console.error("Bucket parse error", e) }
          }
          setActiveBoatLevel((prev: number) => savedBoat || prev)
          setFishCap((prev: number) => {
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
            walletAddress: address,
            distributionBucket: bucketRef.current,
            currentIndex: indexRef.current
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
    <div className="flex min-h-screen flex-col bg-[#075985] text-white overflow-hidden font-sans">
      {/* Headless Controller */}
      <MiningController
        fishCapPerHour={fishCap}
        speedMultiplier={Date.now() < boosterExpiry ? 1.05 : 1.0}
        initialBucket={distributionBucket}
        initialIndex={bucketIndex}
        onProgressUpdate={(b, i) => {
          setDistributionBucket(b)
          setBucketIndex(i)
        }}
        onCatch={handleCatch}
        isActive={true}
      />

      {/* TOP NAVBAR */}
      <div className="flex items-center justify-between p-4 bg-[#0c4a6e]/80 backdrop-blur-md border-b border-white/10 z-50">
        <div className="flex items-center gap-3">
          <button className="text-2xl opacity-80">☰</button>
          <button onClick={() => setIsSwapOpen(true)} className="p-2 bg-white/10 rounded-lg">⚙️</button>
          <button
            onClick={() => setVolumeOn(!volumeOn)}
            className={`p-2 rounded-lg transition-all ${volumeOn ? 'bg-sky-400/20 text-sky-300' : 'bg-white/5 opacity-40'}`}
          >
            {volumeOn ? '🔊' : '🔇'}
          </button>
          <button
            onClick={() => setAnnounceOn(!announceOn)}
            className={`p-2 rounded-lg transition-all ${announceOn ? 'bg-orange-400/20 text-orange-300' : 'bg-white/5 opacity-40'}`}
          >
            {announceOn ? '📢' : '🔇'}
          </button>
        </div>

        <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-full border border-white/10">
          <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-[10px] font-bold">⚡</div>
          <span className="text-xs font-mono opacity-80">
            {address ? `${address.slice(0, 4)}...${address.slice(-4)}` : 'DISCONNECTED'}
          </span>
        </div>
      </div>

      {/* BALANCE SECTION */}
      <div className="p-4 grid grid-cols-2 gap-4 relative">
        {/* Unprocessed */}
        <div className="bg-[#0f172a]/60 p-4 rounded-2xl border border-white/5">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#FDE047] opacity-80">Unprocessed</p>
          <p className="text-2xl font-mono font-black text-[#FDE047] drop-shadow-[0_0_10px_rgba(253,224,71,0.3)]">
            {minedFish.toFixed(3)}
          </p>
        </div>

        {/* Processed */}
        <div className="bg-[#0f172a]/60 p-4 rounded-2xl border border-white/5 text-right">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#4ADE80] opacity-80">Processed</p>
          <p className="text-2xl font-mono font-black text-[#4ADE80] drop-shadow-[0_0_10px_rgba(74,222,128,0.3)]">
            {(minedFish * 0.05).toFixed(3)}
          </p>
        </div>

        {/* Process Button (Center Overlap) */}
        <button
          onClick={() => setIsSwapOpen(true)}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#22C55E] hover:bg-[#16A34A] px-4 py-2 rounded-xl font-black text-xs uppercase tracking-tighter border-2 border-[#14532D] shadow-[0_4px_0_#14532D] active:translate-y-1 active:shadow-none transition-all"
        >
          Process ➔
        </button>
      </div>

      {/* USDC SUB-BALANCE */}
      <div className="px-4 pb-2">
        <div className="bg-[#1e293b]/80 p-3 rounded-xl border border-white/5 inline-flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold shadow-inner">S</div>
          <div>
            <p className="text-[8px] font-bold opacity-50 uppercase leading-none mb-1">$USDC.s</p>
            <p className="text-sm font-black font-mono leading-none">0.052</p>
          </div>
        </div>
      </div>

      {/* CENTRAL GAME AREA */}
      <div className="flex-1 relative mx-4 mb-4 rounded-[2.5rem] border-4 border-[#0c4a6e] bg-hex-pattern overflow-hidden shadow-2xl">
        <FishingGame
          activeBoatLevel={activeBoatLevel}
          currentRate={total}
          isMuted={!volumeOn}
        />

        {/* Floating Rod Card */}
        <div className="absolute top-6 left-6 z-40 bg-[#1e293b]/90 backdrop-blur-md p-4 rounded-[2rem] border-2 border-white/10 w-48 shadow-2xl">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 rounded-full bg-[#0ea5e9]/20 border-2 border-[#0ea5e9]/50 flex items-center justify-center text-2xl">🎣</div>
            <div>
              <p className="text-[10px] font-black opacity-50 uppercase">Rod</p>
              <p className="text-sm font-black">Level {rodLevel}</p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[8px] font-bold opacity-50 uppercase">Durability</p>
            <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
              <div className="h-full bg-green-500 w-[80%] shadow-[0_0_10px_#22C55E]"></div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between opacity-80">
            <span className="text-[10px] font-bold uppercase">Supercast</span>
            <span className="flex items-center gap-1 font-mono font-bold text-sky-400">
              ⚡ {spinTickets}
            </span>
          </div>
        </div>
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className="px-4 pb-8 pt-2 grid grid-cols-2 gap-4 bg-gradient-to-t from-black/20 to-transparent">
        <button
          className="group relative bg-[#FDE047] hover:bg-[#FACC15] p-6 rounded-[2rem] border-b-8 border-[#A16207] shadow-xl active:border-b-0 active:translate-y-2 transition-all flex flex-col items-center justify-center gap-1 overflow-hidden"
        >
          <span className="text-2xl relative z-10 transition-transform group-active:scale-90">🎬</span>
          <span className="font-black text-black text-lg tracking-tighter relative z-10">AUTO-CAST</span>
          <div className="absolute right-2 bottom-2 text-4xl opacity-10 rotate-12 group-hover:scale-125 transition-all">🎣</div>
        </button>

        <button
          onClick={() => setIsSpinOpen(true)}
          className="group relative bg-[#A855F7] hover:bg-[#9333EA] p-6 rounded-[2rem] border-b-8 border-[#581C87] shadow-xl active:border-b-0 active:translate-y-2 transition-all flex flex-col items-center justify-center gap-1"
        >
          <span className="text-2xl relative z-10 ⚡ transition-transform group-active:scale-90">⚡</span>
          <span className="font-black text-white text-lg tracking-tighter relative z-10 uppercase">Super-Cast</span>
          <div className="absolute right-4 top-4 bg-black/20 px-2 py-1 rounded-full text-[10px] font-mono font-bold">{spinTickets}</div>
        </button>
      </div>

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
    </div>
  )

}

