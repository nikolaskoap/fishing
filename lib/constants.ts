export const APP_URL = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

export const BOAT_CONFIG = {
  0: { // FREE
    price: 0,
    catchingRate: 0.05,
    fishPerHour: 0,
    label: "Free Mode"
  },
  10: {
    price: 10,
    catchingRate: 0.15,
    fishPerHour: 100,
    label: "Small Boat"
  },
  20: {
    price: 20,
    catchingRate: 0.16,
    fishPerHour: 150,
    label: "Medium Boat"
  },
  50: {
    price: 50,
    catchingRate: 0.20,
    fishPerHour: 250,
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

export const FISH_VALUES = {
  LEGENDARY: 10,
  EPIC: 5,
  UNCOMMON: 3,
  COMMON: 1,
  JUNK: 0.1
} as const;

// Developer Setup for Testing
export const DEVELOPER_FIDS = [
  3, // Example: Dan Romero
  2, // Example: Varun Srinivasan
  // Add your FID here
  873523, // Placeholder for user's FID
];

export const isDeveloper = (fid: number | string | undefined): boolean => {
  if (!fid) return false;
  const numFid = typeof fid === 'string' ? parseInt(fid) : fid;
  return DEVELOPER_FIDS.includes(numFid);
};
