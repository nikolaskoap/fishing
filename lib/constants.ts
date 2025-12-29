export const APP_URL = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

export type BoatTier = "SMALL" | "MEDIUM" | "LARGE";

export const BOAT_CONFIG: Record<BoatTier, {
  price: number
  catchingRate: number
  fishPerHour: number
}> = {
  SMALL: { price: 10, catchingRate: 0.15, fishPerHour: 10 },
  MEDIUM: { price: 20, catchingRate: 0.16, fishPerHour: 25 },
  LARGE: { price: 50, catchingRate: 0.20, fishPerHour: 60 },
};

export const DIFFICULTY_CONFIG = {
  BASE_DIFFICULTY: 1.0,
  PLAYER_REDUCTION: 0.001, // 0.1% per player
  MIN_DIFFICULTY: 0.5
};

export const GLOBAL_CONFIG = {
  DAILY_CATCH_CAP: 500,
  MIN_CAST_INTERVAL: 4000, // 4 seconds
  REFERRAL_MIN_CASTS: 50,
  REFERRAL_REWARD_USDC: 1,
}

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
  1064256, // User's FID
];

export const isDeveloper = (fid: number | string | undefined): boolean => {
  if (!fid) return false;
  const numFid = typeof fid === 'string' ? parseInt(fid) : fid;
  return DEVELOPER_FIDS.includes(numFid);
};
