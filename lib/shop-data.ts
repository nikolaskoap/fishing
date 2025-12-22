export interface FishingRod {
    id: string;
    name: string;
    description: string;
    priceUsdc: number;
    image: string; // Emoji or URL
    miningBonus: number; // Fish per hour bonus
}

export const FISHING_RODS: FishingRod[] = [
    {
        id: "rod-level-1",
        name: "Basic Rod (Level 1)",
        description: "A good start. +10 Fish/hr.",
        priceUsdc: 10,
        image: "🎣",
        miningBonus: 10,
    },
    {
        id: "rod-level-2",
        name: "Pro Rod (Level 2)",
        description: "Better handling. +30 Fish/hr.",
        priceUsdc: 20,
        image: "🎎",
        miningBonus: 30,
    },
    {
        id: "rod-level-5",
        name: "Master Rod (Level 5)",
        description: "Top tier. +59 Fish/hr.",
        priceUsdc: 30,
        image: "🔱",
        miningBonus: 59,
    },
];
