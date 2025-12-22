'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { OceanBackground, OceanBackgroundRef } from './OceanBackground'
// Removed SwapMenu and mining/shop data imports as they are handled in Home now

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

  // Cleanup
  useEffect(() => {
    return () => stopTimers()
  }, [])

  return (
    <div className="relative w-full aspect-[3/5] max-h-[600px] rounded-xl overflow-hidden shadow-2xl border border-[#0A5CDD]/50 bg-black">

      {/* Background Image/Canvas */}
      <OceanBackground ref={oceanRef} />

      {/* UI Overlay (Score Only) */}
      {gameState !== 'caught' && (
        <div className="absolute top-4 right-4 z-10 flex gap-2 items-start text-xs md:text-sm">
          <div className="bg-black/60 backdrop-blur-md p-2 md:p-3 rounded-lg border border-[#0A5CDD]/30 shadow-[0_4px_20px_rgba(0,0,0,0.5)] transform hover:scale-105 transition-transform">
            <p className="text-[#A3B3C2] text-[10px] md:text-xs uppercase tracking-wider mb-0.5">Score</p>
            <p className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200 font-mono">{score}</p>
          </div>
        </div>
      )}

      {/* Caught Popup */}
      {lastCatch && gameState !== 'caught' && (
        <div className="absolute top-20 right-4 z-10 animate-fade-in-down bg-black/70 backdrop-blur-xl p-3 md:p-4 rounded-xl border border-[#F472B6]/30 shadowavy flex flex-col items-end">
          <p className="text-[10px] md:text-xs uppercase tracking-wider font-bold mb-1" style={{ color: lastCatch.color }}>{lastCatch.rarity}</p>
          <p className="text-base md:text-lg font-bold text-white drop-shadow-md">{lastCatch.name}</p>
        </div>
      )}

      {/* Center Action Area */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pt-20 pointer-events-none">
        {/* Message Status */}
        <div className={`mb-8 px-6 py-3 rounded-full bg-black/40 backdrop-blur-lg border border-white/10 text-white font-bold text-xl transition-all duration-300 transform ${gameState === 'bite' ? 'scale-125 bg-red-500/20 border-red-500/50 text-red-200 animate-pulse' : 'scale-100'}`}>
          {message}
        </div>

        {/* Fishing Line/Bobber Area */}
        <div className="relative h-64 w-full pointer-events-none z-10">
          {/* Rod Visual (Bottom Right) */}
          <div className={`absolute bottom-[-10px] right-[-30px] w-32 h-32 md:w-48 md:h-48 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-bottom-right z-20 ${gameState === 'casting' ? 'rotate-[-45deg] translate-y-4' : gameState === 'reeling' ? 'rotate-[10deg] scale-105' : 'rotate-0 hover:rotate-2'}`}>
            <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl filter brightness-110">
              {/* Rod Handle */}
              <path d="M180,180 L140,140" stroke="#333" strokeWidth="12" strokeLinecap="round" />
              {/* Rod Body */}
              <defs>
                <linearGradient id="rodGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#888" />
                  <stop offset="100%" stopColor="#fff" />
                </linearGradient>
              </defs>
              <path d="M140,140 L20,20" stroke="url(#rodGradient)" strokeWidth="4" strokeLinecap="round" />
              {/* Reel */}
              <circle cx="150" cy="150" r="14" fill="#333" stroke="#555" strokeWidth="2" />
              <circle cx="150" cy="150" r="4" fill="#111" />
              {/* Line Guide (Tip) - Visual anchor */}
              <circle cx="20" cy="20" r="3" fill="#fff" className="animate-pulse" />
            </svg>
          </div>

          {/* Line & Bobber Container */}
          <div className="absolute inset-0 z-10">
            {gameState !== 'idle' && gameState !== 'caught' && (
              <div className="absolute top-0 left-0 w-full h-full">
                {/* Dynamic Line Visual */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                  <line
                    x1={gameState === 'casting' ? '55%' : gameState === 'reeling' ? '72%' : '70%'}
                    y1={gameState === 'casting' ? '75%' : gameState === 'reeling' ? '60%' : '65%'}
                    x2="50%" y2="55%"
                    stroke="rgba(255,255,255,0.8)"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                    className={`transition-all duration-300 ${gameState === 'casting' ? 'opacity-0' : 'opacity-100'}`}
                  />
                </svg>

                {/* Bobber / Hook */}
                <div className={`absolute top-[55%] left-1/2 -translate-x-1/2 w-4 h-4 
                       ${gameState === 'casting' ? 'scale-0 translate-y-[-200px]' : 'scale-100 translate-y-0'}
                       transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]`}
                >
                  {/* Float Animation Wrapper */}
                  <div className={`${(gameState === 'waiting' || gameState === 'bite') ? 'animate-float' : ''}`}>
                    <div className={`w-5 h-5 rounded-full bg-gradient-to-b from-red-400 to-red-600 shadow-[0_0_20px_rgba(239,68,68,0.6)] relative ring-2 ring-white/20`}>
                      <div className="absolute top-0 w-full h-1/2 bg-white rounded-t-full opacity-40"></div>
                      {gameState === 'bite' && (
                        <>
                          <div className="absolute -inset-4 border-2 border-red-500 rounded-full animate-ping opacity-75"></div>
                          <div className="absolute -inset-8 border border-white/30 rounded-full animate-ping animation-delay-300"></div>
                        </>
                      )}
                    </div>
                    {/* Splash Effect */}
                    {gameState === 'casting' && (
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-4 bg-blue-400 rounded-full blur-sm opacity-0 animate-splash-water"></div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Caught Visual Overlay */}
            {gameState === 'caught' && lastCatch && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-bounce-in z-50 w-full px-4 text-center pointer-events-none">
                <div className="text-7xl md:text-9xl filter drop-shadow-[0_0_30px_rgba(255,255,255,0.6)] mb-6 animate-bounce">
                  {lastCatch.rarity === 'Trash' ? '👢' : '🐟'}
                </div>
                <div
                  className="px-6 py-4 rounded-2xl backdrop-blur-xl border border-white/20 text-white font-bold shadow-2xl flex flex-col items-center gap-2 w-full max-w-[240px] transform transition-all hover:scale-105"
                  style={{ background: `linear-gradient(135deg, rgba(0,0,0,0.9), ${lastCatch.color}40)` }}
                >
                  <span className="text-xs uppercase tracking-[0.2em] opacity-80 border-b border-white/10 pb-1 w-full text-center">{lastCatch.rarity}</span>
                  <span className="text-xl md:text-2xl break-words leading-tight text-center drop-shadow-md" style={{ color: lastCatch.color }}>{lastCatch.name}</span>
                  <div className="bg-white/10 px-3 py-1 rounded-full mt-1">
                    <span className="text-yellow-400 font-mono text-sm md:text-base font-bold">+{lastCatch.points} XP</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="mt-auto mb-10 w-full px-6 pointer-events-auto">
          {gameState === 'idle' || gameState === 'caught' ? (
            <button
              onClick={gameState === 'caught' ? resetGame : castLine}
              className="group relative w-full py-4 overflow-hidden rounded-2xl bg-[#0A5CDD] text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="absolute inset-0 translate-y-[100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-y-[-100%] group-hover:animate-shimmer" />
              <span className="relative font-bold text-xl tracking-widest uppercase drop-shadow-md">
                {gameState === 'caught' ? 'Fish Again' : 'CAST LINE'}
              </span>
            </button>
          ) : (
            <button
              onClick={reelIn}
              disabled={gameState === 'casting' || gameState === 'reeling'}
              className={`w-full py-5 rounded-2xl font-bold text-2xl uppercase tracking-widest transition-all transform duration-200 border-b-4 ${gameState === 'bite'
                ? 'bg-gradient-to-b from-red-500 to-red-700 border-red-900 text-white shadow-[0_0_40px_rgba(220,38,38,0.5)] animate-pulse scale-105 hover:scale-110 active:scale-95 cursor-pointer'
                : 'bg-gray-800 border-gray-900 text-gray-500 cursor-not-allowed grayscale'
                }`}
            >
              {gameState === 'bite' ? '!!! PULL !!!' : gameState === 'reeling' ? 'REELING...' : 'WAIT...'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
