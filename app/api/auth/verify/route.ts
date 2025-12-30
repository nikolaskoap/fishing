import { redis } from '@/lib/redis'
import { NextRequest, NextResponse } from 'next/server'
import { verifyMessage } from 'viem'
import { isDeveloper } from '@/lib/constants'
import { ensureUser } from '@/lib/ensureUser'

export async function POST(req: NextRequest) {
    let fid: string | undefined;
    try {
        const { fid: rawFid, address, signature } = await req.json()
        fid = rawFid?.toString()

        if (!fid || !address || !signature) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const nonce = await redis.get(`nonce:${fid}`)
        if (!nonce) {
            return NextResponse.json({ error: 'Nonce expired or not found' }, { status: 400 })
        }

        const message = `Sign this message to login to Base Fishing: ${nonce}`

        const isValid = await verifyMessage({
            address: address as `0x${string}`,
            message,
            signature: signature as `0x${string}`,
        })

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }

        // Signature is valid, delete nonce
        await redis.del(`nonce:${fid}`)

        // Initialize/Update User Data using ensureUser
        const userData = await ensureUser(redis, fid, address)

        if (!userData) {
            console.error("ENSURE_USER_FAILED", { fid, wallet: address })
            return NextResponse.json(
                { error: "USER_INITIALIZATION_FAILED" },
                { status: 500 }
            )
        }

        const userKey = `user:${fid}`

        // Wallet Binding Rule: STRICT LOCK
        // If wallet is "N/A" (legacy/placeholder), bind it now.
        // If wallet is set and mismatch -> ERROR.

        if (userData.wallet === "N/A" || !userData.wallet) {
            console.log(`WALLET_BIND_INIT`, { fid, new: address })
            await redis.hset(userKey, { wallet: address })
            userData.wallet = address
        } else if (userData.wallet !== address) {
            console.error(`WALLET_MISMATCH`, { fid, registered: userData.wallet, incoming: address })
            return NextResponse.json({ error: 'WALLET_MISMATCH' }, { status: 401 })
        }

        // Set session marker to prevent session-less API calls
        await redis.set(`auth:session:${fid}`, address, { ex: 86400 }) // 24h session

        return NextResponse.json({
            success: true,
            userId: fid.toString(),
            mode: userData.mode,
            socialVerified: userData.socialVerified === "true"
        })
    } catch (error: any) {
        console.error('API_ERROR', {
            route: '/api/auth/verify',
            fid,
            error: error.message
        })
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
