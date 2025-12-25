import { redis } from '@/lib/redis'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
    try {
        // Placeholder stats
        return NextResponse.json({
            totalCaught: 1245670,
            activeMiners: 124,
            difficulty: "99.8%"
        })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
