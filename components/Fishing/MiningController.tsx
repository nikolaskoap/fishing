'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export type FishRarity = 'Common' | 'Uncommon' | 'Epic' | 'Legendary'

export interface FishCatch {
    id: string
    rarity: FishRarity
    value: number
    timestamp: number
}

const FISH_VALUES: Record<FishRarity, number> = {
    Legendary: 10,
    Epic: 5,
    Uncommon: 3,
    Common: 1
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

    // Core Bucket Generation Logic (Anti-Abuse)
    const generateBucket = useCallback((cap: number) => {
        if (cap <= 0) return []

        let remaining = cap
        const newBucket: FishRarity[] = []

        // Greedy-ish random distribution to fill cap
        while (remaining > 0) {
            let possible: FishRarity[] = []
            if (remaining >= 10) possible.push('Legendary')
            if (remaining >= 5) possible.push('Epic')
            if (remaining >= 3) possible.push('Uncommon')
            if (remaining >= 1) possible.push('Common')

            const choice = possible[Math.floor(Math.random() * possible.length)]
            newBucket.push(choice)
            remaining -= FISH_VALUES[choice]
        }

        // Shuffle bucket
        return newBucket.sort(() => Math.random() - 0.5)
    }, [])

    // Check for new hour
    useEffect(() => {
        const now = Date.now()
        if (now - hourStart >= 3600000 || bucket.length === 0) {
            const newBucket = generateBucket(fishCapPerHour)
            setBucket(newBucket)
            setCurrentIndex(0)
            setHourStart(now - (now % 3600000)) // Snap to start of hour
            if (onProgressUpdate) onProgressUpdate(newBucket, 0)
        }
    }, [hourStart, fishCapPerHour, generateBucket, bucket.length])

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
