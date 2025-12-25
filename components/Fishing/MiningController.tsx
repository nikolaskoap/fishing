'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export type FishRarity = 'COMMON' | 'UNCOMMON' | 'EPIC' | 'LEGENDARY' | 'JUNK'

export interface FishCatch {
    id: string
    rarity: FishRarity
    value: number
    timestamp: number
}

const FISH_VALUES: Record<FishRarity, number> = {
    LEGENDARY: 10,
    EPIC: 5,
    UNCOMMON: 3,
    COMMON: 1,
    JUNK: 0.1
}

interface MiningControllerProps {
    fishCapPerHour: number
    speedMultiplier: number
    onCatch: (catchData: FishCatch) => void
    isActive: boolean
    initialBucket?: FishRarity[]
    initialIndex?: number
    onProgressUpdate?: (bucket: FishRarity[], index: number) => void
}

export default function MiningController({
    fishCapPerHour,
    speedMultiplier,
    onCatch,
    isActive,
    initialBucket = [],
    initialIndex = 0,
    onProgressUpdate
}: MiningControllerProps) {
    const [bucket, setBucket] = useState<FishRarity[]>(initialBucket)
    const [currentIndex, setCurrentIndex] = useState(initialIndex)
    const [hourStart, setHourStart] = useState(Date.now())

    // Simplified: Mirror the server-side bucket
    useEffect(() => {
        if (initialBucket.length > 0) {
            setBucket(initialBucket)
            setCurrentIndex(initialIndex)
        }
    }, [initialBucket, initialIndex])

    // Casting Loop
    useEffect(() => {
        if (!isActive) return

        // Base interval for casting (e.g., every 5-10 seconds based on boat/rod)
        // Rate limiting is also enforced on server (4s)
        const baseInterval = 8000
        const interval = baseInterval / speedMultiplier

        const timeout = setTimeout(() => {
            onCatch({
                id: Math.random().toString(36).substr(2, 9),
                rarity: 'COMMON', // Placeholder, server will override
                value: 0,
                timestamp: Date.now()
            })
            // Continue the loop by triggering a re-render/useEffect
            setCurrentIndex(prev => prev + 1)
        }, interval)

        return () => clearTimeout(timeout)
    }, [isActive, currentIndex, speedMultiplier, onCatch])

    return null // Headless component
}
