'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { OceanBackground, OceanBackgroundRef } from './OceanBackground'
// Removed SwapMenu and mining/shop data imports as they are handled in Home now

type GameState = 'idle' | 'casting' | 'waiting' | 'bite' | 'reeling' | 'caught'

type FishType = {
  name: string
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Unrare' | 'Epic' | 'Legendary' | 'Trash'
  multiplier: number
  color: string
}

const FISH_TYPES: FishType[] = [
  { name: 'Neon Guppy', rarity: 'Common', multiplier: 1, color: '#4ADE80' },
  { name: 'Cyber Bass', rarity: 'Uncommon', multiplier: 1.5, color: '#2DD4BF' },
  { name: 'Holo Tuna', rarity: 'Rare', multiplier: 3, color: '#60A5FA' },
  { name: 'Matrix Koi', rarity: 'Unrare', multiplier: 5, color: '#818CF8' },
  { name: 'Data Eel', rarity: 'Epic', multiplier: 10, color: '#A855F7' },
  { name: 'Quantum Shark', rarity: 'Legendary', multiplier: 50, color: '#F472B6' },
  { name: 'Buggy Trash', rarity: 'Trash', multiplier: 0.1, color: '#9CA3AF' },
]

export function FishingGame({
  activeBoatLevel = 0,
  currentRate = 0,
  onCatch,
  onSelectBoat,
  onBuyBooster
}: {
  activeBoatLevel: number
  currentRate: number
  onCatch?: (amount: number, xp: number) => void
  onSelectBoat: (level: number, price: number) => void
  onBuyBooster: () => void
}) {
  const [gameState, setGameState] = useState<GameState>('idle')
  const [lastCatch, setLastCatch] = useState<FishType | null>(null)
  const [message, setMessage] = useState('Ready to fish?')
  const [showInfo, setShowInfo] = useState(false)

  // Timers
  const biteTimerRef = useRef<NodeJS.Timeout | null>(null)
  const escapeTimerRef = useRef<NodeJS.Timeout | null>(null)
  const oceanRef = useRef<OceanBackgroundRef>(null)

  const stopTimers = () => {
    if (biteTimerRef.current) clearTimeout(biteTimerRef.current)
    if (escapeTimerRef.current) clearTimeout(escapeTimerRef.current)
  }

  const castLine = () => {
    setGameState('casting')
    setMessage('Casting line...')
    setLastCatch(null)

    setTimeout(() => {
      setGameState('waiting')
      setMessage('Waiting for a bite...')
      if (oceanRef.current) oceanRef.current.triggerRipple(0.5, 0.55)

      const waitTime = Math.random() * 4000 + 2000
      biteTimerRef.current = setTimeout(() => {
        setGameState('bite')
        setMessage('!!! BITE !!! TAP NOW!')
        escapeTimerRef.current = setTimeout(() => {
          setGameState('idle')
          setMessage('The fish got away...')
        }, 1500)
      }, waitTime)
    }, 1000)
  }

  const reelIn = () => {
    stopTimers()
    if (gameState === 'bite') {
      setGameState('reeling')
      setMessage('Reeling in!!!')
      setTimeout(() => determineCatch(), 1000)
    } else {
      setGameState('idle')
      setMessage('Too early! You scared it.')
    }
  }

  const determineCatch = () => {
    const rand = Math.random() * 100
    let caughtFish: FishType

    // Distribution:
    // Legendary: 0.1%
    // Epic: 1%
    // Unrare: 5%
    // Rare: 14%
    // Uncommon: 30%
    // Common: 50%

    if (rand <= 0.1) caughtFish = FISH_TYPES.find(f => f.rarity === 'Legendary')!
    else if (rand <= 1.1) caughtFish = FISH_TYPES.find(f => f.rarity === 'Epic')!
    else if (rand <= 6.1) caughtFish = FISH_TYPES.find(f => f.rarity === 'Unrare')!
    else if (rand <= 20) caughtFish = FISH_TYPES.find(f => f.rarity === 'Rare')!
    else if (rand <= 50) caughtFish = FISH_TYPES.find(f => f.rarity === 'Uncommon')!
    else caughtFish = FISH_TYPES.find(f => f.rarity === 'Common')!

    // Calculated Points: Target 12 catches per hour
    // Base Fish Per Catch = currentRate / 12
    const baseFishPerCatch = currentRate / 12
    const finalPoints = baseFishPerCatch * caughtFish.multiplier

    setLastCatch(caughtFish)
    setGameState('caught')
    setMessage(`Caught: ${caughtFish.name}!`)

    if (onCatch) onCatch(finalPoints, 25)
  }

  const resetGame = () => {
    setGameState('idle')
    setMessage('Ready to fish?')
    setLastCatch(null)
  }

  useEffect(() => {
    return () => stopTimers()
  }, [])

  // Boat Selection Overlay
  if (activeBoatLevel === 0) {
    return (
      <div className="relative w-full h-[60vh] min-h-[550px] bg-[#000814] flex flex-col items-center justify-center p-6 text-center">
        <div className="absolute inset-0 opacity-20 bg-[url('/ocean-bg.jpg')] bg-cover"></div>
        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-2 z-10">
          WELCOME SURVIVOR
        </h2>
        <p className="text-gray-400 text-xs mb-8 uppercase tracking-widest z-10">Choose your vessel to start mining</p>

        <div className="grid grid-cols-1 gap-4 w-full max-w-xs z-10">
          <button
            onClick={() => onSelectBoat(1, 10)}
            className="group flex items-center justify-between p-4 bg-[#001226] border border-blue-500/30 rounded-2xl hover:border-blue-400 transition-all hover:scale-105"
          >
            <div className="text-left">
              <p className="font-bold text-white">BASIC RAFT</p>
              <p className="text-[10px] text-blue-400">10 FISH / HOUR</p>
            </div>
            <span className="bg-blue-500 text-white px-3 py-1 rounded-full font-bold text-sm">$10</span>
          </button>
          <button
            onClick={() => onSelectBoat(2, 20)}
            className="group flex items-center justify-between p-4 bg-[#001226] border border-purple-500/30 rounded-2xl hover:border-purple-400 transition-all hover:scale-105"
          >
            <div className="text-left">
              <p className="font-bold text-white">SPEED BOAT</p>
              <p className="text-[10px] text-purple-400">25 FISH / HOUR</p>
            </div>
            <span className="bg-purple-500 text-white px-3 py-1 rounded-full font-bold text-sm">$20</span>
          </button>
          <button
            onClick={() => onSelectBoat(3, 50)}
            className="group flex items-center justify-between p-4 bg-[#001226] border border-yellow-500/30 rounded-2xl hover:border-yellow-400 transition-all hover:scale-105"
          >
            <div className="text-left">
              <p className="font-bold text-white">STEALTH YACHT</p>
              <p className="text-[10px] text-yellow-400">60 FISH / HOUR</p>
            </div>
            <span className="bg-yellow-500 text-black px-3 py-1 rounded-full font-bold text-sm">$50</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-[60vh] min-h-[550px] bg-black overflow-hidden border-y border-[#0A5CDD]/50 shadow-2xl">
      <OceanBackground ref={oceanRef} />

      {/* Rarity Info Dashboard (Floating) */}
      <div className="absolute top-4 left-4 z-30 flex flex-col gap-1">
        <p className="text-[8px] text-gray-500 uppercase font-bold mb-1">Active Multiplier</p>
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10">
          <span className="text-xl">🛥️</span>
          <div>
            <p className="text-[10px] text-white font-bold leading-tight">BOAT LEVEL {activeBoatLevel}</p>
            <p className="text-[8px] text-cyan-400 font-mono">{currentRate} FISH/HR</p>
          </div>
        </div>
        <button
          onClick={onBuyBooster}
          className="mt-2 bg-orange-500/20 hover:bg-orange-500/40 border border-orange-500/50 text-orange-200 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tighter transition-all"
        >
          ⚡ Buy 1H Booster ($5)
        </button>
      </div>

      {/* Caught Visual Overlay */}
      {gameState === 'caught' && lastCatch && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center animate-bounce-in pointer-events-none bg-black/40 backdrop-blur-sm">
          <div className="text-7xl md:text-9xl filter drop-shadow-[0_0_30px_rgba(255,255,255,0.6)] mb-8 animate-bounce">
            {lastCatch.rarity === 'Trash' ? '👢' : '🐟'}
          </div>
          <div
            className="px-8 py-6 rounded-3xl backdrop-blur-xl border border-white/20 text-white font-bold shadow-2xl flex flex-col items-center gap-3 w-full max-w-[280px] transform transition-all"
            style={{ background: `linear-gradient(135deg, rgba(0,0,0,0.95), ${lastCatch.color}60)` }}
          >
            <span className="text-xs uppercase tracking-[0.3em] opacity-80 border-b border-white/10 pb-2 w-full text-center">{lastCatch.rarity}</span>
            <span className="text-2xl md:text-3xl text-center drop-shadow-lg" style={{ color: lastCatch.color }}>{lastCatch.name}</span>
            <div className="bg-white/10 px-4 py-1.5 rounded-full mt-2 border border-white/5">
              <span className="text-yellow-400 font-mono text-base md:text-lg font-bold">+{(currentRate / 12 * lastCatch.multiplier).toFixed(3)} Fish</span>
              <span className="text-[10px] text-gray-400 ml-2 border-l border-gray-600 pl-2">25 XP</span>
            </div>
          </div>
        </div>
      )}

      {/* Center Action Area */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pt-10 pointer-events-none">
        <div className={`mb-12 px-6 py-3 rounded-full bg-black/40 backdrop-blur-lg border border-white/10 text-white font-bold text-xl transition-all duration-300 transform ${gameState === 'bite' ? 'scale-125 bg-red-500/20 border-red-500/50 text-red-200 animate-pulse' : 'scale-100'}`}>
          {message}
        </div>

        <div className="relative h-64 w-full pointer-events-none z-10">
          <div className={`absolute bottom-[-10px] right-[-30px] w-32 h-32 md:w-48 md:h-48 transition-all duration-700 ease-out origin-bottom-right z-20 ${gameState === 'casting' ? 'rotate-[-45deg]' : gameState === 'reeling' ? 'rotate-[10deg]' : ''}`}>
            <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
              <path d="M180,180 L20,20" stroke="#fff" strokeWidth="4" />
              <circle cx="180" cy="180" r="10" fill="#333" />
            </svg>
          </div>

          <div className="absolute inset-0 z-10">
            {gameState !== 'idle' && gameState !== 'caught' && (
              <div className="absolute top-[55%] left-1/2 -translate-x-1/2">
                <div className={`w-5 h-5 rounded-full bg-red-500 shadow-xl ${gameState === 'bite' ? 'animate-ping' : ''}`}></div>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="mt-auto mb-10 w-full px-6 pointer-events-auto z-40">
          <button
            onClick={gameState === 'caught' ? resetGame : castLine}
            disabled={gameState === 'casting' || (gameState !== 'idle' && gameState !== 'caught' && gameState !== 'bite')}
            className={`w-full py-4 rounded-2xl font-bold text-xl transition-all ${gameState === 'bite' ? 'bg-red-600 scale-105 animate-pulse' : 'bg-[#0A5CDD]'
              } text-white shadow-lg`}
          >
            {gameState === 'caught' ? 'CONTINUE' : gameState === 'bite' ? 'PULL!' : 'CAST LINE'}
          </button>
        </div>
      </div>
    </div>
  )
}
