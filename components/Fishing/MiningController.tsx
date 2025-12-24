'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export type FishRarity = 'COMMON' | 'UNCOMMON' | 'EPIC' | 'LEGENDARY'

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
    COMMON: 1
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
        if (!isActive || bucket.length === 0 || currentIndex >= bucket.length) return

        // Calculate interval: 3600s / items * multiplier
        const baseInterval = 3600000 / bucket.length
        const interval = baseInterval / speedMultiplier

        const timeout = setTimeout(() => {
            const rarity = bucket[currentIndex]
            onCatch({
                id: Math.random().toString(36).substr(2, 9),
                rarity,
                value: FISH_VALUES[rarity],
                timestamp: Date.now()
            })
            const nextIndex = currentIndex + 1
            setCurrentIndex(nextIndex)
            if (onProgressUpdate) onProgressUpdate(bucket, nextIndex)
        }, interval)

        return () => clearTimeout(timeout)
    }, [isActive, bucket, currentIndex, speedMultiplier, onCatch])

    return null // Headless component
}
