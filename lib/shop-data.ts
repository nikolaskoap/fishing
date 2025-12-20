export interface Boat {
    id: string;
    name: string;
    description: string;
    priceUsdt: number;
    image: string; // Emoji or URL
    speed: number;
}

export const BOATS: Boat[] = [
    {
        id: "wooden-raft",
        name: "Wooden Raft",
        description: "A simple raft. Better than swimming.",
        priceUsdt: 1,
        image: "🪵",
        speed: 1,
    },
    {
        id: "speedboat",
        name: "Speedboat",
        description: "Fast and sleek. Catch fish efficiently.",
        priceUsdt: 10,
        image: "🚤",
        speed: 5,
    },
    {
        id: "luxury-yacht",
        name: "Luxury Yacht",
        description: "The ultimate status symbol. Fish in style.",
        priceUsdt: 100,
        image: "🛥️",
        speed: 20,
    },
];
