'use client'

import React, { useState, useEffect } from 'react'
import SplashScreen from '../screens/SplashScreen'
import ConnectWalletScreen from '../screens/ConnectWalletScreen'
import FollowGateScreen from '../screens/FollowGateScreen'
import BoatSelectionGate from '../screens/BoatSelectionGate'
import MainGameScreen from '../screens/MainGameScreen'
import FreeModeScreen from '../screens/FreeModeScreen'
import { useAccount } from 'wagmi'

type ScreenState = 'SPLASH' | 'CONNECT' | 'FOLLOW' | 'BOAT' | 'GAME' | 'FREE'

export default function App() {
    const [view, setView] = useState<ScreenState>('SPLASH')
    const { isConnected } = useAccount()

    // Handle Splash Finish
    const handleSplashFinish = () => {
        if (!isConnected) {
            setView('CONNECT')
        } else {
            setView('FOLLOW')
        }
    }

    // Handle Wallet Connection
    useEffect(() => {
        if (view === 'CONNECT' && isConnected) {
            setView('FOLLOW')
        }
    }, [isConnected, view])

    return (
        <main className="min-h-screen bg-[#075985] text-white">
            {view === 'SPLASH' && (
                <SplashScreen onFinish={handleSplashFinish} />
            )}

            {view === 'CONNECT' && (
                <ConnectWalletScreen onConnect={() => setView('FOLLOW')} />
            )}

            {view === 'FOLLOW' && (
                <FollowGateScreen onComplete={() => setView('BOAT')} />
            )}

            {view === 'BOAT' && (
                <BoatSelectionGate
                    onSelect={(boat) => setView('GAME')}
                    onFreeMode={() => setView('FREE')}
                />
            )}

            {view === 'GAME' && (
                <MainGameScreen />
            )}

            {view === 'FREE' && (
                <FreeModeScreen />
            )}
        </main>
    )
}
