export const REFERRAL_CONFIG = {
    // Aktivasi Criteria (salah satu harus terpenuhi)
    ACTIVATION: {
        MIN_CASTS: 10,
        MIN_FISH: 5,
        MIN_SPINS: 1
    },

    // Milestone Rewards (Model 1 - SAFE VALUES)
    MILESTONES: {
        FIRST_ACTIVE: { reward: 2, key: 'first_active' },
        CAST_10: { reward: 1, key: 'cast_10' },
        FISH_50: { reward: 5, key: 'fish_50' },
        BOAT_UPGRADE: { reward: 3, key: 'boat_upgrade' }
    },

    // Anti-Abuse Limits
    MAX_FISH_PER_REFERRAL: 20,
    MAX_FISH_PER_DAY: 100,

    // Percentage Model (backup option)
    PERCENTAGE_REWARD: 0.1 // 10%
}
