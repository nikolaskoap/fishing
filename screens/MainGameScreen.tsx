'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { BoatShop } from '@/components/Shop/BoatShop'
import { WalletActions } from '@/components/Home/WalletActions'
import { FishingGame } from '@/components/Fishing/FishingGame'
import { SwapMenu } from '@/components/Swap/SwapMenu'
import { SpinMenu } from '@/components/Home/SpinMenu'
import { useFrame } from '@/components/farcaster-provider'
import { useAccount, useWriteContract } from 'wagmi'
import { parseUnits } from 'viem'
import { USDT_ADDRESS, PAYMENT_RECIPIENT, ERC20_ABI } from "@/lib/contracts";
import MiningController, { FishCatch, FishRarity } from '@/components/Fishing/MiningController';
import BoosterPanel from '@/components/Fishing/BoosterPanel';
import GlobalStats from '@/components/Home/GlobalStats';
import { MenuDrawer } from '@/components/Home/MenuDrawer';
import { ConvertMenu } from '@/components/Home/ConvertMenu';
import { StatsMenu } from '@/components/Home/StatsMenu';
import { InventoryMenu } from '@/components/Home/InventoryMenu';
import { InviteMenu } from '@/components/Home/InviteMenu';

import { BOAT_CONFIG, BOAT_TIER_MAP } from '@/lib/constants';
import { miningService } from '@/services/mining.service';
import { spinService } from '@/services/spin.service';
import { swapService } from '@/services/swap.service';

export default function MainGameScreen() {
  const { context } = useFrame()
  const { address } = useAccount()
  const fid = context?.user.fid

  // Mining & Boat State
  const [minedFish, setMinedFish] = useState(0)
  const [canFishBalance, setCanFishBalance] = useState(0)
  const [onlineMiners, setOnlineMiners] = useState(1)
  const [rodLevel, setRodLevel] = useState(1) // Legacy rod
  const [activeBoatLevel, setActiveBoatLevel] = useState(0)
  const [fishCap, setFishCap] = useState(0)
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
  const [isAutoCastActive, setIsAutoCastActive] = useState(false)
  const [catchNotification, setCatchNotification] = useState<{
    rarity: FishRarity,
    value: number,
    label?: string,
    subLabel?: string
  } | null>(null)

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

  // Swap & Spin Menus
  const [isSwapOpen, setIsSwapOpen] = useState(false)
  const [isSpinOpen, setIsSpinOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isConvertOpen, setIsConvertOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [socialVerified, setSocialVerified] = useState(false)
  const [isSocialGateOpen, setIsSocialGateOpen] = useState(false)
  const [isStatsOpen, setIsStatsOpen] = useState(false)
  const [isInventoryOpen, setIsInventoryOpen] = useState(false)
  const [isInviteOpen, setIsInviteOpen] = useState(false)

  // 1. Load Data on Mount
  useEffect(() => {
    if (!fid) return

    const loadUserData = async () => {
      try {
        const authData = await miningService.connect(fid, address || "0x")
        setUserId(authData.userId)
        setSocialVerified(authData.socialVerified)

        // Persist userId for child components (SpinWheel, etc)
        localStorage.setItem('userId', authData.userId)
          ; (window as any).userId = authData.userId

        const data = await miningService.getUser(fid)

        if (data && !data.error) {
          const savedFish = parseFloat(data.minedFish || '0')
          const savedCanFish = parseFloat(data.canFishBalance || '0')
          const savedRod = parseInt(data.rodLevel || '1')
          const savedBoat = parseInt(data.activeBoatLevel || '0')
          const savedBooster = parseInt(data.boosterExpiry || '0')
          const savedXp = parseInt(data.xp || '0')
          const savedTickets = parseInt(data.spinTickets || '0')
          const savedLastDaily = parseInt(data.lastDailySpin || '0')
          const savedRefs = parseInt(data.referralCount || '0')
          const savedInvitees = data.invitees || []
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
          setActiveBoatLevel(savedBoat)
          const boatTierKey = BOAT_TIER_MAP[savedBoat]
          const config = boatTierKey ? BOAT_CONFIG[boatTierKey] : null
          setFishCap(config?.fishPerHour || 0)
          setBoosterExpiry(savedBooster)
          setXp(savedXp)
          setSpinTickets(savedTickets)
          setLastDailySpin(savedLastDaily)
          setReferralCount(savedRefs)
          setInvitees(savedInvitees)

          if (savedRefs >= 3) setHasClaimed3Ref(true)

          setMinedFish(savedFish)
          setCanFishBalance(savedCanFish)
        }
      } catch (e) {
        console.error("Load error", e)
      }
    }
    loadUserData()
  }, [fid, address])

  // Clear notification after 3 seconds
  useEffect(() => {
    if (catchNotification) {
      const timer = setTimeout(() => setCatchNotification(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [catchNotification])

  // 2. Periodic Saver (Reduced necessity as /cast saves, but good for XP/Tickets)
  useEffect(() => {
    if (!fid) return

    const interval = setInterval(async () => {
      try {
        await miningService.saveUser({
          fid,
          minedFish: minedFishRef.current,
          activeBoatLevel: boatRef.current,
          boosterExpiry: boosterRef.current,
          rodLevel: rodLevel,
          xp: xpRef.current,
          spinTickets,
          lastDailySpin,
          referralCount,
          walletAddress: address
        })
      } catch (e) { console.error("Save error", e) }
    }, 30000)

    return () => clearInterval(interval)
  }, [fid, address, spinTickets, lastDailySpin, referralCount])

  const handleCatch = useCallback(async (catchData: FishCatch) => {
    if (!fid) return

    // PRACTICE MODE / FREE MODE: Show local UI feedback only
    if (activeBoatLevel === 0) {
      setCatchNotification({
        rarity: catchData.rarity,
        value: 0
      })
      return
    }

    try {
      // 1. Call real server-side cast
      const result = await miningService.cast(userId || fid.toString())

      if (result.status === "SUCCESS") {
        // 2. Update all stats immediately based on server response
        setMinedFish(result.minedFish)
        setXp(result.xp)
        setBucketIndex(result.currentIndex)

        // Update refs for periodic saver
        minedFishRef.current = result.minedFish
        xpRef.current = result.xp

        if (announceOn) {
          console.log(`[PAID MODE] Caught ${result.fishType}! +${result.fishValue} fish`)
        }

        // 3. Show catch notification popup
        setCatchNotification({
          rarity: result.fishType as FishRarity,
          value: result.fishValue
        })
      } else if (result.status === "SESSION_EXPIRED") {
        setIsAutoCastActive(false)
        alert("Session expired. Please restart Auto-Cast.")
      } else if (result.status === "MISS") {
        setCatchNotification({
          rarity: 'JUNK',
          value: 0,
          label: "MISS!",
          subLabel: "Better luck next time"
        })
      } else if (result.status === "CAP_REACHED") {
        setCatchNotification({
          rarity: 'JUNK',
          value: 0,
          label: "CAP REACHED",
          subLabel: "Wait for the next hour"
        })
      }
    } catch (e) {
      console.error("Mining error in PAID mode", e)
    }
  }, [fid, announceOn, activeBoatLevel])

  // Simple animation loop for miners count only
  useEffect(() => {
    const minerInterval = setInterval(() => {
      setOnlineMiners(Math.floor(Math.random() * 10) + 1)
    }, 10000)
    return () => clearInterval(minerInterval)
  }, [])

  const handleSwap = async (amount: number) => {
    if (!fid || !address) {
      alert("Please connect wallet first")
      return
    }

    try {
      setMinedFish(prev => Math.max(0, prev - amount))
      setIsSwapOpen(false)

      const result = await swapService.withdraw(fid, address, amount)
      if (result.success) {
        minedFishRef.current -= amount
        // Update user state after succesful swap
        await miningService.saveUser({
          fid,
          minedFish: minedFishRef.current,
          walletAddress: address
        })
        alert(`Withdraw Request Sent! ID: ${result.id || 'pending'}`)
      } else {
        alert("Withdraw failed: " + (result.error || 'Unknown error'))
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

  const handleBuyBooster = async () => {
    if (!address) return
    const dev = typeof window !== 'undefined' && (window as any).isDeveloper;

    try {
      if (dev) {
        console.log("Developer detected, bypassing booster payment...");
      } else {
        writeContract({
          address: USDT_ADDRESS,
          abi: ERC20_ABI,
          functionName: "transfer",
          args: [PAYMENT_RECIPIENT, parseUnits("5", 6)],
        })
      }

      // Update state immediately for devs or after success for others (simplified here for testing)
      setBoosterExpiry(Date.now() + (60 * 60 * 1000))
      alert(dev ? "Developer Boost Activated! (Free)" : "Booster Purchased! +5% Yield for 1 Hour.")
    } catch (e) {
      console.error(e)
      alert("Transaction Failed")
    }
  }

  const handleConvert = async (amount: number) => {
    if (!fid) return
    try {
      const result = await miningService.convert(fid, amount)
      if (result.success) {
        setMinedFish(result.minedFish)
        setCanFishBalance(result.canFishBalance)
        console.log(`Successfully converted ${amount} Fish`)
      } else {
        alert("Conversion failed: " + result.error)
      }
    } catch (e) {
      console.error("Conversion error", e)
      alert("Error during conversion")
    }
  }

  // Calculate current effective rate
  const getMiningStats = () => {
    let rate = 0
    if (activeBoatLevel === 10) rate = 10
    else if (activeBoatLevel === 20) rate = 25
    else if (activeBoatLevel === 50) rate = 60

    let boosterMult = 1.0
    if (Date.now() < boosterExpiry) boosterMult = 1.5

    let refBonusValue = 0
    if (referralCount >= 100) refBonusValue = 10

    const total = (rate * boosterMult) + refBonusValue
    return { total }
  }

  const { total } = getMiningStats()

  return (
    <div className="flex min-h-screen flex-col bg-[#075985] text-white overflow-hidden font-sans w-full max-w-md mx-auto relative">
      <MenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onOpenSwap={() => setIsSwapOpen(true)}
        onOpenSpin={() => setIsSpinOpen(true)}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenInvite={() => setIsInviteOpen(true)}
        onOpenInventory={() => setIsInventoryOpen(true)}
      />

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
        isActive={isAutoCastActive}
      />

      {/* SOCIAL GATE OVERLAY */}
      {!socialVerified && (
        <div className="absolute inset-0 z-[100] bg-[#001226]/95 flex flex-col items-center justify-center p-8 backdrop-blur-md">
          <div className="bg-[#075985] p-8 rounded-[3rem] border-4 border-[#0ea5e9] shadow-[0_0_50px_rgba(14,165,233,0.3)] max-w-sm w-full text-center space-y-6">
            <div className="text-6xl mb-4">🛡️</div>
            <h2 className="text-3xl font-black text-white italic">SOCIAL GATE</h2>
            <p className="text-cyan-200 text-sm font-bold">Follow & Recast to unlock the Ocean!</p>

            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3 bg-[#0c4a6e] p-4 rounded-2xl">
                <span className="text-2xl">👤</span>
                <div>
                  <p className="text-xs text-cyan-400 font-black uppercase">Step 1</p>
                  <p className="text-sm font-bold">Follow @basefishing</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-[#0c4a6e] p-4 rounded-2xl">
                <span className="text-2xl">🔄</span>
                <div>
                  <p className="text-xs text-cyan-400 font-black uppercase">Step 2</p>
                  <p className="text-sm font-bold">Recast pinned post</p>
                </div>
              </div>
            </div>

            <button
              onClick={async () => {
                const res = await miningService.verifySocial(userId || fid?.toString() || "0", true, true);
                if (res.verified) {
                  setSocialVerified(true);
                } else {
                  alert("Verification failed. Please check steps.");
                }
              }}
              className="w-full bg-[#FDE047] text-black py-4 rounded-2xl font-black text-xl shadow-[0_4px_0_#A16207] hover:translate-y-1 hover:shadow-none transition-all"
            >
              VERIFY & UNLOCK
            </button>
          </div>
        </div>
      )}

      {/* TOP NAVBAR */}
      <div className="flex items-center justify-between p-4 bg-[#0c4a6e]/80 backdrop-blur-md border-b border-white/10 z-40">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMenuOpen(true)} className="text-2xl opacity-80 hover:scale-110 px-2">☰</button>
          <button onClick={() => setIsSwapOpen(true)} className="p-2 bg-white/10 rounded-lg hidden md:block">⚙️</button>
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

        <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-full border border-white/10 max-w-[120px]">
          <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">⚡</div>
          <span className="text-[10px] font-mono opacity-80 truncate">
            {address ? `${address.slice(0, 4)}...${address.slice(-4)}` : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* BALANCE SECTION */}
      <div className="p-4 grid grid-cols-2 gap-4 relative">
        {/* Unprocessed -> Fish */}
        <div className="bg-[#0f172a]/60 p-4 rounded-2xl border border-white/5 shadow-inner">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#FDE047] opacity-60">Fish</p>
          <p className="text-2xl font-mono font-black text-[#FDE047] drop-shadow-[0_0_10px_rgba(253,224,71,0.2)]">
            {minedFish.toFixed(3)}
          </p>
        </div>

        {/* Processed -> CAN Fish */}
        <div className="bg-[#0f172a]/60 p-4 rounded-2xl border border-white/5 text-right shadow-inner">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#4ADE80] opacity-60">CAN Fish</p>
          <p className="text-2xl font-mono font-black text-[#4ADE80] drop-shadow-[0_0_10px_rgba(74,222,128,0.2)]">
            {canFishBalance.toFixed(3)}
          </p>
        </div>

        {/* Convert Button (Center) */}
        <button
          onClick={() => setIsConvertOpen(true)}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#22C55E] hover:bg-[#16A34A] px-4 py-2 rounded-xl font-black text-xs uppercase tracking-tighter border-2 border-[#14532D] shadow-[0_4px_0_#14532D] active:translate-y-1 active:shadow-none transition-all z-10"
        >
          CONVERT ➔
        </button>
      </div>

      {/* USDC SUB-BALANCE */}
      <div className="px-4 pb-2 flex items-center justify-between gap-4">
        {/* USDC SUB-BALANCE */}
        <div className="bg-[#1e293b]/50 p-3 rounded-xl border border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold shadow-inner">USDC</div>
          <div>
            <p className="text-[8px] font-bold opacity-50 uppercase leading-none mb-1">Staged Fund</p>
            <p className="text-sm font-black font-mono leading-none">0.052</p>
          </div>
        </div>

        {/* Rod Card (Moved from game area to top balance section) */}
        <div className="bg-[#1e293b]/95 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3 shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#0ea5e9]/20 border border-[#0ea5e9]/40 flex items-center justify-center text-xs">🎣</div>
            <div>
              <p className="text-[8px] font-black opacity-30 uppercase leading-none">Rod</p>
              <p className="text-[10px] font-black italic leading-none">Level {rodLevel}</p>
            </div>
          </div>
          <div className="w-16">
            <div className="h-1 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 mb-0.5">
              <div className="h-full bg-green-500 w-[75%] shadow-[0_0_8px_#22C55E]"></div>
            </div>
            <p className="text-[6px] font-bold opacity-30 text-right uppercase">75%</p>
          </div>
        </div>
      </div>

      {/* CENTRAL GAME AREA */}
      <div className="flex-1 relative mx-4 mb-4 rounded-[2.5rem] border-4 border-[#0c4a6e] bg-[#075985] overflow-hidden shadow-2xl">
        <FishingGame
          activeBoatLevel={activeBoatLevel}
          currentRate={total}
          isMuted={!volumeOn}
          isActive={isAutoCastActive}
        />

        {/* Catch Notification Popup */}
        {catchNotification && (
          <div className="absolute top-10 left-1/2 -translate-x-1/2 z-50 bg-black/80 backdrop-blur-xl border-2 border-yellow-400/50 p-4 rounded-3xl flex flex-col items-center gap-2 animate-bounce-in shadow-[0_0_40px_rgba(250,204,21,0.5)] min-w-[180px]">
            <div className="relative w-24 h-24 overflow-hidden rounded-2xl border-2 border-white/10 bg-white/5">
              {catchNotification.rarity === 'COMMON' && <img src="/assets/image/fish cummon.jpg" className="w-full h-full object-cover" alt="Common Fish" />}
              {catchNotification.rarity === 'UNCOMMON' && <img src="/assets/image/fish uncommon.jpg" className="w-full h-full object-cover" alt="Uncommon Fish" />}
              {catchNotification.rarity === 'EPIC' && <img src="/assets/image/fish rare.jpg" className="w-full h-full object-cover" alt="Epic Fish" />}
              {catchNotification.rarity === 'LEGENDARY' && <img src="/assets/image/legendary fish.jpg" className="w-full h-full object-cover" alt="Legendary Fish" />}
              {catchNotification.rarity === 'JUNK' && (
                <div className="text-5xl flex items-center justify-center h-full">
                  {Math.random() > 0.5 ? '👟' : '🥫'}
                </div>
              )}
            </div>

            <div className="text-center">
              <p className="text-[10px] font-black text-yellow-300 uppercase tracking-widest">
                {catchNotification.label || (catchNotification.rarity === 'JUNK' ? 'You Reeled In!' : 'You Caught!')}
              </p>
              <p className="text-sm font-black uppercase italic text-white">
                {catchNotification.subLabel || catchNotification.rarity}
              </p>
              {catchNotification.value > 0 && (
                <p className="text-xs font-bold text-green-300 mt-1 bg-green-400/10 px-3 py-1 rounded-full border border-green-400/20">
                  +{catchNotification.value} {catchNotification.rarity === 'JUNK' ? 'Scrap' : 'Fish'}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className="px-4 pb-8 pt-2 grid grid-cols-2 gap-4 bg-gradient-to-t from-[#020617] to-transparent">
        <button
          onClick={async () => {
            if (!isAutoCastActive && activeBoatLevel > 0) {
              try {
                const res = await miningService.startMining(userId || fid?.toString() || "");
                if (res.error) {
                  alert("Failed to start session: " + res.error);
                  return;
                }
              } catch (e) {
                console.error("Session start error", e);
              }
            }
            setIsAutoCastActive(!isAutoCastActive);
          }}
          className={`group relative p-6 rounded-[2.5rem] border-b-8 shadow-xl active:border-b-0 active:translate-y-2 transition-all flex flex-col items-center justify-center gap-1 overflow-hidden
            ${isAutoCastActive
              ? 'bg-[#4ADE80] border-[#166534] text-black ring-4 ring-green-400/50'
              : 'bg-[#FDE047] border-[#A16207] text-black'
            }`}
        >
          <span className={`text-2xl relative z-10 transition-transform group-active:scale-95 ${isAutoCastActive ? 'animate-bounce' : ''}`}>
            {isAutoCastActive ? '🛶' : '⚓'}
          </span>
          <span className="font-black text-sm tracking-tight relative z-10">
            {isAutoCastActive ? 'CASTING...' : 'AUTO-CAST'}
          </span>
        </button>

        <button
          onClick={() => handleBuyBooster()}
          className={`group relative p-6 rounded-[2.5rem] border-b-8 transition-all flex flex-col items-center justify-center gap-1
            ${Date.now() < boosterExpiry
              ? 'bg-blue-500 border-blue-800 text-white cursor-wait'
              : 'bg-[#A855F7] hover:bg-[#9333EA] border-[#581C87] shadow-xl active:border-b-0 active:translate-y-2'
            }`}
        >
          <span className="text-2xl relative z-10 ⚡ transition-transform group-active:scale-95">⚡</span>
          <span className="font-black text-white text-sm tracking-tight relative z-10 uppercase">
            {Date.now() < boosterExpiry ? 'BOOSTING...' : 'BOOSTER'}
          </span>
          <p className="text-[8px] font-black opacity-40">+5% SPEED</p>
        </button>
      </div>

      <ConvertMenu
        isOpen={isConvertOpen}
        onClose={() => setIsConvertOpen(false)}
        fishBalance={minedFish}
        onConvert={handleConvert}
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

      <StatsMenu
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        stats={{
          totalCaught: minedFish,
          xp,
          level: currentLevel,
          rodLevel: rodLevel,
          boatLevel: activeBoatLevel
        }}
      />

      <InventoryMenu
        isOpen={isInventoryOpen}
        onClose={() => setIsInventoryOpen(false)}
        rodLevel={rodLevel}
        boatLevel={activeBoatLevel}
      />

      <InviteMenu
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        referralCount={referralCount}
        fid={fid || 0}
      />
    </div>
  )
}
