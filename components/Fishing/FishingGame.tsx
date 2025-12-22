'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { OceanBackground, OceanBackgroundRef } from './OceanBackground'
import { FISHING_RODS } from '@/lib/shop-data'
import { SwapMenu } from '@/components/Swap/SwapMenu'

type GameState = 'idle' | 'casting' | 'waiting' | 'bite' | 'reeling' | 'caught'

type FishType = {
  name: string
  rarity: 'Common' | 'Rare' | 'Legendary' | 'Trash'
  points: number
  color: string
}

const FISH_TYPES: FishType[] = [
  { name: 'Neon Guppy', rarity: 'Common', points: 10, color: '#4ADE80' },
  { name: 'Cyber Bass', rarity: 'Common', points: 15, color: '#4ADE80' },
  { name: 'Holo Tuna', rarity: 'Rare', points: 50, color: '#60A5FA' },
  { name: 'Matrix Koi', rarity: 'Rare', points: 75, color: '#60A5FA' },
  { name: 'Quantum Shark', rarity: 'Legendary', points: 1000, color: '#F472B6' },
  { name: 'Old Boot.exe', rarity: 'Trash', points: 0, color: '#9CA3AF' },
]

export function FishingGame() {
  const [gameState, setGameState] = useState<GameState>('idle')
  const [score, setScore] = useState(0)
  const [lastCatch, setLastCatch] = useState<FishType | null>(null)
  const [message, setMessage] = useState('Ready to fish?')

  // Mining State
  const [minedFish, setMinedFish] = useState(0)
  const [onlineMiners, setOnlineMiners] = useState(1) // Starts with just user
  const [rodLevel, setRodLevel] = useState(1) // Default Level 1 (+10)
  const BASE_RATE = 60

  // Swap Menu State
  const [isSwapOpen, setIsSwapOpen] = useState(false)

  // Timers
  const biteTimerRef = useRef<NodeJS.Timeout | null>(null)
  const escapeTimerRef = useRef<NodeJS.Timeout | null>(null)
  const oceanRef = useRef<OceanBackgroundRef>(null)

  // Mining Simulation Loop
  useEffect(() => {
    // Randomize miners every 10 seconds (simulating network activity)
    const minerInterval = setInterval(() => {
      // Skews towards low numbers for demo, max 20
      setOnlineMiners(Math.floor(Math.random() * 10) + 1)
    }, 10000)

    // Mining Loop (Tick every 1s)
    const miningInterval = setInterval(() => {
      // Logic: Rate = (60 - (Miners - 1))
      // Min rate 0 if too many miners? User implies functionality, assuming min 1 or 0.
      // Let's cap drop at 0 base rate.
      const minerPenalty = Math.max(0, onlineMiners - 1)
      const currentBaseRate = Math.max(0, BASE_RATE - minerPenalty)

      // Get Rod Bonus
      let rodBonus = 0
      if (rodLevel === 5) rodBonus = 59
      else if (rodLevel === 2) rodBonus = 30
      else rodBonus = 10 // Default Level 1

      const totalRatePerHour = currentBaseRate + rodBonus
      const fishPerSecond = totalRatePerHour / 3600

      setMinedFish(prev => prev + fishPerSecond)
    }, 1000)

    return () => {
      clearInterval(minerInterval)
      clearInterval(miningInterval)
    }
  }, [onlineMiners, rodLevel])

  const stopTimers = () => {
    if (biteTimerRef.current) clearTimeout(biteTimerRef.current)
    if (escapeTimerRef.current) clearTimeout(escapeTimerRef.current)
  }

  const castLine = () => {
    setGameState('casting')
    setMessage('Casting line...')
    setLastCatch(null)

    // Animation delay for casting
    setTimeout(() => {
      setGameState('waiting')
      setMessage('Waiting for a bite...')

      // Trigger Ripple Effect when line lands
      if (oceanRef.current) {
        oceanRef.current.triggerRipple(0.5, 0.55)
      }

      // Random wait time between 2s and 6s
      const waitTime = Math.random() * 4000 + 2000

      biteTimerRef.current = setTimeout(() => {
        setGameState('bite')
        setMessage('!!! BITE !!! TAP NOW!')

        // Bite window: 1s to catch
        escapeTimerRef.current = setTimeout(() => {
          setGameState('idle')
          setMessage('The fish got away...')
        }, 1500) // 1.5s reaction time

      }, waitTime)
    }, 1000)
  }

  const reelIn = () => {
    stopTimers()

    if (gameState === 'bite') {
      setGameState('reeling')
      setMessage('Reeling in!!!')

      setTimeout(() => {
        determineCatch()
      }, 1000)
    } else {
      // Pulled too early
      setGameState('idle')
      setMessage('Too early! You scared it.')
    }
  }

  const determineCatch = () => {
    const rand = Math.random() * 100
    let caughtFish: FishType

    // RNG Logic
    if (rand < 15) {
      // 15% Trash
      caughtFish = FISH_TYPES.find(f => f.rarity === 'Trash') || FISH_TYPES[5]
    } else if (rand < 65) {
      // 50% Common (15-65)
      const commons = FISH_TYPES.filter(f => f.rarity === 'Common')
      caughtFish = commons[Math.floor(Math.random() * commons.length)]
    } else if (rand < 95) {
      // 30% Rare (65-95)
      const rares = FISH_TYPES.filter(f => f.rarity === 'Rare')
      caughtFish = rares[Math.floor(Math.random() * rares.length)]
    } else {
      // 5% Legendary (95-100)
      const legendaries = FISH_TYPES.filter(f => f.rarity === 'Legendary')
      caughtFish = legendaries[Math.floor(Math.random() * legendaries.length)]
    }

    setScore(s => s + caughtFish.points)
    setLastCatch(caughtFish)
    setGameState('caught')
    setMessage(`Caught: ${caughtFish.name}! (+${caughtFish.points})`)
  }

  const resetGame = () => {
    setGameState('idle')
    setMessage('Ready to fish?')
    setLastCatch(null)
  }

  const handleSwap = (amount: number) => {
    setMinedFish(prev => Math.max(0, prev - amount))
    // In a real app, here we would credit USDC or show a success toast
    setMessage(`Swapped ${amount} Fish for ${amount} USDC!`)
    setIsSwapOpen(false)
  }

  // Cleanup
  useEffect(() => {
    return () => stopTimers()
  }, [])

  // Helper to get mining bonus for display
  const getRodBonus = () => {
    if (rodLevel === 5) return 59
    if (rodLevel === 2) return 30
    return 10
  }

  const miningRateInfo = () => {
    const penalty = Math.max(0, onlineMiners - 1)
    const currentBase = Math.max(0, BASE_RATE - penalty)
    const bonus = getRodBonus()
    return { currentBase, bonus, total: currentBase + bonus }
  }

  const { currentBase, bonus, total } = miningRateInfo()

  return (
    <div className="relative w-full aspect-[3/5] max-h-[600px] rounded-xl overflow-hidden shadow-2xl border border-[#0A5CDD]/50 bg-black">

      <SwapMenu
        isOpen={isSwapOpen}
        onClose={() => setIsSwapOpen(false)}
        minedFish={minedFish}
        onSwap={handleSwap}
      />

      {/* Background Image */}
      <OceanBackground ref={oceanRef} />

      {/* Mining Overlay (Top Left) */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md p-2 rounded-lg border border-[#0A5CDD]/30 min-w-[120px]">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">⛏️ Mining Status</p>
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

        <div className="bg-black/60 backdrop-blur-md p-2 rounded-lg border border-[#F472B6]/30 pointer-events-auto">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">🎁 Mined Fish</p>
          <div className="flex items-end justify-between gap-2">
            <p className="text-xl font-mono text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-bold">
              {minedFish.toFixed(4)}
            </p>
            <button
              onClick={() => setIsSwapOpen(true)}
              className="px-2 py-0.5 text-[10px] uppercase font-bold bg-green-500/20 text-green-300 border border-green-500/50 rounded hover:bg-green-500/30 transition-colors"
            >
              Swap
            </button>
          </div>
        </div>
      </div>


      {/* UI Overlay */}
      {gameState !== 'caught' && (
        <div className="absolute top-4 right-4 z-10 flex gap-2 items-start text-xs md:text-sm">
          <div className="bg-black/60 backdrop-blur-md p-2 md:p-3 rounded-lg border border-[#0A5CDD]/30">
            <p className="text-[#A3B3C2] text-[10px] md:text-xs uppercase tracking-wider">Score</p>
            <p className="text-xl md:text-2xl font-bold text-white font-mono">{score}</p>
          </div>
        </div>
      )}

      {/* Caught Popup (Right Side, below score) */}
      {lastCatch && gameState !== 'caught' && (
        <div className="absolute top-20 right-4 z-10 animate-fade-in-down bg-black/60 backdrop-blur-md p-2 md:p-3 rounded-lg border border-[#F472B6]/30">
          <p className="text-[10px] md:text-xs uppercase tracking-wider text-right" style={{ color: lastCatch.color }}>{lastCatch.rarity}</p>
          <p className="text-base md:text-lg font-bold text-white">{lastCatch.name}</p>
        </div>
      )}

      {/* Center Action Area */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pt-20">

        {/* Message Status */}
        <div className={`mb-8 p-3 rounded-md bg-black/50 backdrop-blur text-white font-bold text-xl transition-all ${gameState === 'bite' ? 'scale-125 text-red-400 animate-pulse' : ''}`}>
          {message}
        </div>

        {/* Fishing Line/Bobber Area */}
        <div className="relative h-64 w-full pointer-events-none z-10">
          {/* Rod Visual (Bottom Right) */}
          <div className={`absolute bottom-[-20px] right-[-40px] w-32 h-32 md:w-48 md:h-48 transition-transform duration-500 origin-bottom-right z-20 ${gameState === 'casting' ? 'rotate-[-45deg]' : gameState === 'reeling' ? 'rotate-[10deg]' : 'rotate-0'}`}>
            <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl">
              {/* Rod Handle */}
              <path d="M180,180 L140,140" stroke="#333" strokeWidth="12" strokeLinecap="round" />
              {/* Rod Body */}
              <path d="M140,140 L20,20" stroke="#fff" strokeWidth="3" strokeLinecap="round" className="opacity-80" />
              {/* Reel */}
              <circle cx="150" cy="150" r="12" fill="#444" stroke="#222" strokeWidth="2" />
            </svg>
          </div>

          {/* Line & Bobber Container */}
          <div className="absolute inset-0 z-10">
            {gameState !== 'idle' && gameState !== 'caught' && (
              <div className="absolute top-0 left-0 w-full h-full">
                {/* Dynamic Line Visual */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                  <line
                    x1="80%" y1="80%"
                    x2="50%" y2="55%"
                    stroke="rgba(255,255,255,0.4)"
                    strokeWidth="1"
                    className={`transition-all duration-300 ${gameState === 'casting' ? 'opacity-0' : 'opacity-100'}`}
                  />
                </svg>

                {/* Bobber / Hook */}
                <div className={`absolute top-[55%] left-1/2 -translate-x-1/2 w-4 h-4 
                       ${gameState === 'casting' ? 'scale-0 translate-y-[-200px]' : 'scale-100 translate-y-0'}
                       transition-all duration-700 ease-out`}
                >
                  {/* Float Animation Wrapper */}
                  <div className={`${(gameState === 'waiting' || gameState === 'bite') ? 'animate-float' : ''}`}>
                    <div className={`w-4 h-4 rounded-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)] relative`}>
                      <div className="absolute top-0 w-full h-1/2 bg-white rounded-t-full opacity-50"></div>
                      {gameState === 'bite' && (
                        <div className="absolute -inset-4 border-2 border-red-500 rounded-full animate-ping"></div>
                      )}
                    </div>
                    {/* Splash Effect Placeholder - needs global CSS */}
                    {gameState === 'casting' && (
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-4 bg-blue-400 rounded-full blur-sm opacity-0 animate-splash-water"></div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Caught Visual Overlay */}
            {gameState === 'caught' && lastCatch && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-bounce-in z-50 w-full px-4 text-center">
                <div className="text-6xl md:text-8xl filter drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] mb-4 animate-bounce">
                  {lastCatch.rarity === 'Trash' ? '👢' : '🐟'}
                </div>
                <div
                  className="px-4 py-2 md:px-6 md:py-3 rounded-2xl backdrop-blur-md border border-white/20 text-white font-bold shadow-xl flex flex-col items-center gap-1 w-full max-w-[200px]"
                  style={{ background: `linear-gradient(135deg, rgba(0,0,0,0.8), ${lastCatch.color}40)` }}
                >
                  <span className="text-[10px] md:text-sm uppercase tracking-widest opacity-80">{lastCatch.rarity}</span>
                  <span className="text-lg md:text-xl break-words leading-tight text-center" style={{ color: lastCatch.color }}>{lastCatch.name}</span>
                  <span className="text-amber-400 font-mono text-xs md:text-sm">+{lastCatch.points} XP</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="mt-auto mb-10 w-full px-6">
          {gameState === 'idle' || gameState === 'caught' ? (
            <button
              onClick={gameState === 'caught' ? resetGame : castLine}
              className="w-full py-3 md:py-4 bg-gradient-to-r from-[#0A5CDD] to-[#2563EB] hover:from-[#0b6ef3] hover:to-[#3b82f6] text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transform transition active:scale-95 text-lg md:text-xl uppercase tracking-widest"
            >
              {gameState === 'caught' ? 'Fish Again' : 'CAST LINE'}
            </button>
          ) : (
            <button
              onClick={reelIn}
              disabled={gameState === 'casting' || gameState === 'reeling'}
              className={`w-full py-4 md:py-6 rounded-xl font-bold text-xl md:text-2xl uppercase tracking-widest transition-all ${gameState === 'bite'
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_30px_rgba(220,38,38,0.6)] animate-pulse cursor-pointer'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
            >
              {gameState === 'bite' ? 'PULL !!!' : gameState === 'reeling' ? 'REELING...' : 'WAIT...'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
