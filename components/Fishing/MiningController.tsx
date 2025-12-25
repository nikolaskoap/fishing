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
        // If no bucket, and isActive is true, create a temporary practice bucket
        let effectiveBucket = bucket
        if (isActive && bucket.length === 0) {
            effectiveBucket = Array(10).fill('JUNK').map(() =>
                (Math.random() > 0.7 ? 'COMMON' : Math.random() > 0.4 ? 'UNCOMMON' : 'JUNK') as FishRarity
            )
        }

        if (!isActive || effectiveBucket.length === 0) return

        // Reset index if we hit the end of practice bucket
        const index = currentIndex % (effectiveBucket.length || 1)

        // Calculate interval (aim for ~15-20s in practice mode if boat is 0, else use real logic)
        const baseInterval = effectiveBucket.length === 0 ? 15000 : (3600000 / effectiveBucket.length)
        const interval = (baseInterval / speedMultiplier) || 20000

        const timeout = setTimeout(() => {
            const rarity = effectiveBucket[index]
            onCatch({
                id: Math.random().toString(36).substr(2, 9),
                rarity,
                value: FISH_VALUES[rarity],
                timestamp: Date.now()
            })
            const nextIndex = index + 1
            setCurrentIndex(nextIndex)
            if (onProgressUpdate && bucket.length > 0) onProgressUpdate(bucket, nextIndex)
        }, interval)

        return () => clearTimeout(timeout)
    }, [isActive, bucket, currentIndex, speedMultiplier, onCatch])

    return null // Headless component
}
