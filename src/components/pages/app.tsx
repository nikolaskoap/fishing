'use client'

import { useState, useEffect } from 'react'
import { useFrame } from '@/components/farcaster-provider'
import { SafeAreaContainer } from '@/components/safe-area-container'
import Navbar from '../Home/Navbar'
import SplashScreen from '../Home/SplashScreen'
import FollowGate from '../Home/FollowGate'
import { Demo } from '@/components/Home'
import { WalletActions } from '@/components/Home/WalletActions'
import { useAccount } from 'wagmi'
import BoatSelection from '../Shop/BoatSelection'

type FlowState = 'splash' | 'connect' | 'gate' | 'boat' | 'main'

export default function Home() {
  const { context, isLoading: isSDKLoading, isSDKLoaded } = useFrame()
  const { address, isConnected } = useAccount()
  const [flow, setFlow] = useState<FlowState>('splash')
  const [selectedBoat, setSelectedBoat] = useState<any>(null)

  // Handle flow transitions based on wallet connection
  useEffect(() => {
    if (flow === 'connect' && isConnected && address) {
      setFlow('gate')
    }
  }, [isConnected, address, flow])

  if (isSDKLoading) {
    return (
      <SafeAreaContainer insets={context?.client.safeAreaInsets}>
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#000814]">
          <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
        </div>
      </SafeAreaContainer>
    )
  }

  const renderContent = () => {
    switch (flow) {
      case 'splash':
        return <SplashScreen onFinish={() => setFlow('connect')} />

      case 'connect':
        return (
          <div className="flex min-h-screen flex-col items-center justify-center p-6 space-y-12 animate-fade-in">
            <div className="text-center space-y-4">
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-cyan-400 to-blue-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl">
                <span className="text-6xl">🎣</span>
              </div>
              <h1 className="text-4xl font-black text-white">Welcome to<br />Base Fishing</h1>
            </div>
            <div className="w-full max-w-xs">
              <WalletActions />
            </div>
          </div>
        )

      case 'gate':
        return <FollowGate onComplete={() => setFlow('boat')} />

      case 'boat':
        return (
          <BoatSelection
            onSelect={(boat) => {
              setSelectedBoat(boat)
              setFlow('main')
            }}
            onFreeMode={() => {
              setSelectedBoat({ id: 'free', name: 'Free Mode', price: 0, rate: 0, bonus: 0 })
              setFlow('main')
            }}
          />
        )

      case 'main':
        return (
          <>
            <Navbar />
            <Demo initialBoat={selectedBoat} />
          </>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-[#000814] text-white font-sans selection:bg-cyan-500/30">
      <SafeAreaContainer insets={context?.client.safeAreaInsets}>
        {renderContent()}
      </SafeAreaContainer>
    </div>
  )
}

