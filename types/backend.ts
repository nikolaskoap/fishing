export type BoatTier = 0 | 10 | 20 | 50;

export interface UserSession {
    fid: number;
    walletAddress: string;
    activeBoatLevel: BoatTier;
    sessionStartedAt: number;
    lastActionAt: number;
    hourlyProgress: number;
    hourlyCap: number;
}

export interface MiningResult {
    status: 'SUCCESS' | 'MISS' | 'CAP_REACHED' | 'SESSION_EXPIRED';
    fishType?: string;
    fishValue?: number;
    hourlyProgress?: {
        current: number;
        max: number;
    };
}
