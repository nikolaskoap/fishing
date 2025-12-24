import { FishRarity } from "@/components/Fishing/MiningController"

export const BOAT_CONFIG: Record<number, { price: number, fishPerHour: number, baseCastInterval: number }> = {
    0: { price: 0, fishPerHour: 0, baseCastInterval: 999999 }, // Free Mode
    1: { price: 10, fishPerHour: 100, baseCastInterval: 6 },
    2: { price: 20, fishPerHour: 150, baseCastInterval: 5 },
    3: { price: 50, fishPerHour: 250, baseCastInterval: 4 }
}

export const FISH_VALUE: Record<FishRarity, number> = {
    'COMMON': 1,
    'UNCOMMON': 3,
    'EPIC': 5,
    'LEGENDARY': 10
}

export function generateBucket(fishCap: number): FishRarity[] {
    const bucket: FishRarity[] = []
    let remainingFish = fishCap

    const rarities: FishRarity[] = ['LEGENDARY', 'EPIC', 'UNCOMMON', 'COMMON']
    const weights = [0.05, 0.15, 0.30, 0.50] // 5%, 15%, 30%, 50%

    while (remainingFish > 0) {
        // Weighted random
        const r = Math.random()
        let selected: FishRarity = 'COMMON'
        let sum = 0
        for (let i = 0; i < rarities.length; i++) {
            sum += weights[i]
            if (r < sum) {
                selected = rarities[i]
                break
            }
        }

        const value = FISH_VALUE[selected]
        if (value <= remainingFish) {
            bucket.push(selected)
            remainingFish -= value
        } else {
            // If we can't fit the selected, try to fit a common one
            if (remainingFish >= 1) {
                bucket.push('COMMON')
                remainingFish -= 1
            } else {
                break
            }
        }
    }

    // Shuffle bucket
    for (let i = bucket.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bucket[i], bucket[j]] = [bucket[j], bucket[i]]
    }

    return bucket
}
