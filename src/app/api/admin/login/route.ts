import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin, COOKIE_NAME } from '../../../../lib/admin-auth'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { email, password } = body

        if (verifyAdmin(email, password)) {
            const response = NextResponse.json({ success: true })
            // Set HTTP-only cookie
            // Simple token: just the email for now (insecue but fits requirements)
            response.cookies.set(COOKIE_NAME, email, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24, // 1 day
                path: '/'
            })
            return response
        } else {
            return NextResponse.json({ error: 'Invalid Credentials' }, { status: 401 })
        }

    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}
