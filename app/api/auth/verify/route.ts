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
        const userKey = `user:${fid}`

        // Wallet Binding Rule: In auth/verify, we allow updating the wallet 
        // as it's the primary authentication point.
        if (userData.wallet !== address && address !== "N/A") {
            console.log(`WALLET_UPDATE`, { fid, old: userData.wallet, new: address })
            await redis.hset(userKey, { wallet: address })
            userData.wallet = address
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
