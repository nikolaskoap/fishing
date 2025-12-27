import { redis } from '@/lib/redis'
import { NextRequest, NextResponse } from 'next/server'
import { verifyMessage } from 'viem'
import { isDeveloper } from '@/lib/constants'

export async function POST(req: NextRequest) {
    try {
        const { fid, address, signature } = await req.json()
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

        // Initialize/Update User Data
        const userKey = `user:${fid}`
        let userData: any = await redis.hgetall(userKey)
        const dev = isDeveloper(fid)

        if (!userData || Object.keys(userData).length === 0) {
            const initialData = {
                id: fid.toString(),
                fid: fid.toString(),
                walletAddress: address,
                socialVerified: dev ? "true" : "false",
                mode: dev ? "PAID_USER" : "FREE_USER",
                createdAt: Date.now().toString(),
                minedFish: "0",
                canFishBalance: "0",
                rodLevel: "1",
                activeBoatLevel: dev ? "50" : "0",
                xp: "0",
                spinTickets: "1",
                lastDailySpin: "0",
                isQualified: "false" // Initially false, becomes true after first success
            }
            await redis.hset(userKey, initialData)
            userData = initialData
        } else {
            // Hard bind wallet to FID: if wallet changed, we update it but keep session logs
            if (userData.walletAddress !== address) {
                console.log(`User ${fid} changed wallet from ${userData.walletAddress} to ${address}`)
                await redis.hset(userKey, { walletAddress: address })
            }
        }

        // Set session marker to prevent session-less API calls
        await redis.set(`auth:session:${fid}`, address, { ex: 86400 }) // 24h session

        return NextResponse.json({
            success: true,
            userId: fid.toString(),
            mode: userData.mode,
            socialVerified: userData.socialVerified === "true"
        })
    } catch (error) {
        console.error('Verify Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
