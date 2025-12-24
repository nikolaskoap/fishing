// Simple Auth Helper
// In real app, use environment variables or DB for this.

export const ALLOWED_EMAILS = [
    'admin1@gmail.com',
    'admin2@gmail.com',
    'admin3@gmail.com'
]

export const ADMIN_PASSWORD = 'admin123'

export const COOKIE_NAME = 'admin_session_token'

export function verifyAdmin(email: string, password: string): boolean {
    return ALLOWED_EMAILS.includes(email) && password === ADMIN_PASSWORD
}
