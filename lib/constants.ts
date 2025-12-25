export const BOAT_CONFIG = {
  0: { // FREE
    price: 0,
    catchingRate: 0.05, // 5% base for free mode
    hourlyFishCap: 0,
    label: "Free Mode"
  },
  10: {
    price: 10,
    catchingRate: 0.15,
    hourlyFishCap: 100,
    label: "Small Boat"
  },
  20: {
    price: 20,
    catchingRate: 0.16,
    hourlyFishCap: 150,
    label: "Medium Boat"
  },
  50: {
    price: 50,
    catchingRate: 0.20,
    hourlyFishCap: 250,
    label: "Large Boat"
  }
} as const;

export const SWAP_CONFIG = {
  RATE: 100, // 100 CanFish = 5 USDC
  USDC_REWARD: 5,
  FEE: 1, // 1 USDC fee
  MIN_SWAP: 100
}

export const SPIN_CONFIG = {
  COOLDOWN: 30, // 30 seconds
}
