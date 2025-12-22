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

// New Points System
const FISH_TYPES: FishType[] = [
  { name: 'Neon Guppy', rarity: 'Common', points: 0.001, color: '#4ADE80' },
  { name: 'Cyber Bass', rarity: 'Common', points: 0.002, color: '#4ADE80' },
  { name: 'Holo Tuna', rarity: 'Rare', points: 0.5, color: '#60A5FA' },
  { name: 'Matrix Koi', rarity: 'Rare', points: 1.0, color: '#60A5FA' },
  { name: 'Quantum Shark', rarity: 'Legendary', points: 10, color: '#F472B6' },
  { name: 'Old Boot.exe', rarity: 'Trash', points: 0, color: '#9CA3AF' },
]

export function FishingGame({ currentLevel = 1, xpForNext = 1000, onCatch }: {
  currentLevel?: number
  xpForNext?: number
  onCatch?: (xp: number) => void
}) {
  const [gameState, setGameState] = useState<GameState>('idle')
  const [score, setScore] = useState(0)
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

    // New Probabilities
    // 0.001% Legendary
    // 5% Rare
    // 15% Trash
    // ~79.999% Common

    if (rand <= 0.001) {
      // Legendary (0.001% chance)
      const legendaries = FISH_TYPES.filter(f => f.rarity === 'Legendary')
      caughtFish = legendaries[Math.floor(Math.random() * legendaries.length)]
    } else if (rand <= 5) {
      // Rare (5% chance approx)
      const rares = FISH_TYPES.filter(f => f.rarity === 'Rare')
      caughtFish = rares[Math.floor(Math.random() * rares.length)]
    } else if (rand <= 20) {
      // Trash (15% chance: 5 to 20)
      caughtFish = FISH_TYPES.find(f => f.rarity === 'Trash') || FISH_TYPES[5]
    } else {
      // Common (Rest)
      const commons = FISH_TYPES.filter(f => f.rarity === 'Common')
      caughtFish = commons[Math.floor(Math.random() * commons.length)]
    }

    setScore(s => s + caughtFish.points)
    setLastCatch(caughtFish)
    setGameState('caught')
    setMessage(`Caught: ${caughtFish.name}! (+${caughtFish.points})`)

    // Add XP (Fixed 25 per catch)
    if (onCatch) onCatch(25)
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

      {/* UI Overlay (Score & Info) */}
      {gameState !== 'caught' && (
        <div className="absolute top-4 right-4 z-20 flex gap-2 items-start">
          {/* Info Button */}
          <button
            onClick={() => setShowInfo(true)}
            className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400/50 text-blue-200 font-bold flex items-center justify-center hover:bg-blue-500/40 backdrop-blur-md"
          >
            !
          </button>
        </div>
      )}

      {/* Info Modal */}
      {showInfo && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-xl p-6 flex flex-col items-center justify-center animate-fade-in text-center">
          <h2 className="text-xl font-bold text-white mb-4">Fishpedia 📖</h2>
          <div className="space-y-3 text-left w-full max-w-xs text-sm">
            <div className="p-2 border border-pink-500/30 bg-pink-500/10 rounded">
              <span className="text-pink-400 font-bold">Legendary (0.001%)</span>
              <p className="text-xs text-gray-400">Quantum Shark: 10 Fish</p>
            </div>
            <div className="p-2 border border-blue-500/30 bg-blue-500/10 rounded">
              <span className="text-blue-400 font-bold">Rare (~5%)</span>
              <p className="text-xs text-gray-400">Holo Tuna / Matrix Koi: 0.5 - 1.0 Fish</p>
            </div>
            <div className="p-2 border border-green-500/30 bg-green-500/10 rounded">
              <span className="text-green-400 font-bold">Common</span>
              <p className="text-xs text-gray-400">Neon Guppy / Cyber Bass: 0.001 - 0.002 Fish</p>
            </div>
          </div>
          <button
            onClick={() => setShowInfo(false)}
            className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white font-bold"
          >
            Close
          </button>
        </div>
      )}

      {/* Caught Visual Overlay - Root Level for Centering */}
      {gameState === 'caught' && lastCatch && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center animate-bounce-in pointer-events-none bg-black/20 backdrop-blur-sm">
          <div className="text-7xl md:text-9xl filter drop-shadow-[0_0_30px_rgba(255,255,255,0.6)] mb-8 animate-bounce">
            {lastCatch.rarity === 'Trash' ? '👢' : '🐟'}
          </div>
          <div
            className="px-8 py-6 rounded-3xl backdrop-blur-xl border border-white/20 text-white font-bold shadow-2xl flex flex-col items-center gap-3 w-full max-w-[280px] transform transition-all hover:scale-105"
            style={{ background: `linear-gradient(135deg, rgba(0,0,0,0.95), ${lastCatch.color}60)` }}
          >
            <span className="text-xs uppercase tracking-[0.3em] opacity-80 border-b border-white/10 pb-2 w-full text-center">{lastCatch.rarity}</span>
            <span className="text-2xl md:text-3xl break-words leading-tight text-center drop-shadow-lg" style={{ color: lastCatch.color }}>{lastCatch.name}</span>
            <div className="bg-white/10 px-4 py-1.5 rounded-full mt-2 border border-white/5">
              <span className="text-yellow-400 font-mono text-base md:text-lg font-bold">+{lastCatch.points} Fish</span>
              <span className="text-[10px] text-gray-400 ml-2 border-l border-gray-600 pl-2">25 XP</span>
            </div>
          </div>
        </div>
      )}

      {/* Caught Popup (Notification) */}
      {lastCatch && gameState !== 'caught' && (
        <div className="absolute top-20 right-4 z-10 animate-fade-in-down bg-black/70 backdrop-blur-xl p-3 md:p-4 rounded-xl border border-[#F472B6]/30 shadowavy flex flex-col items-end">
          <p className="text-[10px] md:text-xs uppercase tracking-wider font-bold mb-1" style={{ color: lastCatch.color }}>{lastCatch.rarity}</p>
          <p className="text-base md:text-lg font-bold text-white drop-shadow-md">{lastCatch.name}</p>
        </div>
      )}

      {/* Center Action Area */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pt-10 pointer-events-none">

        {/* Message Status - Moved higher to avoid covering fish */}
        <div className={`mb-12 px-6 py-3 rounded-full bg-black/40 backdrop-blur-lg border border-white/10 text-white font-bold text-xl transition-all duration-300 transform ${gameState === 'bite' ? 'scale-125 bg-red-500/20 border-red-500/50 text-red-200 animate-pulse' : 'scale-100'}`}>
          {message}
        </div>

        {/* Fishing Line/Bobber Area */}
        <div className="relative h-64 w-full pointer-events-none z-10">
          {/* Rod Visual (Bottom Right) */}
          <div className={`absolute bottom-[-10px] right-[-30px] w-32 h-32 md:w-48 md:h-48 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-bottom-right z-20 ${gameState === 'casting' ? 'rotate-[-45deg] translate-y-4' : gameState === 'reeling' ? 'rotate-[10deg] scale-105' : 'rotate-0 hover:rotate-2'}`}>
            <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl filter brightness-110">
              <path d="M180,180 L140,140" stroke="#333" strokeWidth="12" strokeLinecap="round" />
              <defs>
                <linearGradient id="rodGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#888" />
                  <stop offset="100%" stopColor="#fff" />
                </linearGradient>
              </defs>
              <path d="M140,140 L20,20" stroke="url(#rodGradient)" strokeWidth="4" strokeLinecap="round" />
              <circle cx="150" cy="150" r="14" fill="#333" stroke="#555" strokeWidth="2" />
              <circle cx="150" cy="150" r="4" fill="#111" />
              <circle cx="20" cy="20" r="3" fill="#fff" className="animate-pulse" />
            </svg>
          </div>

          {/* Line & Bobber Container */}
          <div className="absolute inset-0 z-10">
            {gameState !== 'idle' && gameState !== 'caught' && (
              <div className="absolute top-0 left-0 w-full h-full">
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

                <div className={`absolute top-[55%] left-1/2 -translate-x-1/2 w-4 h-4 
                       ${gameState === 'casting' ? 'scale-0 translate-y-[-200px]' : 'scale-100 translate-y-0'}
                       transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]`}
                >
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
                    {gameState === 'casting' && (
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-4 bg-blue-400 rounded-full blur-sm opacity-0 animate-splash-water"></div>
                    )}
                  </div>
                </div>
              </div>
            )}


          </div>
        </div>

        {/* Controls */}
        <div className="mt-auto mb-10 w-full px-6 pointer-events-auto z-40">
          {gameState === 'idle' || gameState === 'caught' ? (
            <button
              onClick={gameState === 'caught' ? resetGame : castLine}
              className="group relative w-full py-4 overflow-hidden rounded-2xl bg-[#0A5CDD] text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="absolute inset-0 translate-y-[100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-y-[-100%] group-hover:animate-shimmer" />
              <span className="relative font-bold text-xl tracking-widest uppercase drop-shadow-md">
                {gameState === 'caught' ? (
                  <div className="flex flex-col items-center">
                    <span>Fish Again</span>
                    <span className="text-[10px] normal-case opacity-80 mt-1 font-mono">
                      Lvl {currentLevel} • Next in {xpForNext} XP
                    </span>
                  </div>
                ) : 'CAST LINE'}
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
