import { BOAT_CONFIG } from '@/lib/constants'
import { NextResponse } from 'next/server'

export async function GET() {
    const options = Object.entries(BOAT_CONFIG).map(([tier, config]) => ({
        tier: tier === '0' ? 'FREE' : parseInt(tier),
        price: config.price,
        catchingRate: `${(config.catchingRate * 100).toFixed(0)}%`,
        access: tier === '0' ? ["invite", "spin"] : ["mining", "invite", "spin"]
    }))

    return NextResponse.json(options)
}
