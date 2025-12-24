'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const router = useRouter()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })

            const data = await res.json()
            if (data.success) {
                router.push('/admin')
            } else {
                setError(data.error || 'Login Failed')
            }
        } catch (err) {
            setError('Something went wrong')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#000814] text-white p-4">
            <div className="w-full max-w-sm bg-[#001226]/80 p-6 rounded-xl border border-[#0A5CDD]/30 backdrop-blur-md">
                <h1 className="text-2xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                    Admin Access
                </h1>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-2 rounded bg-[#000] border border-gray-800 focus:border-[#0A5CDD] outline-none transition-colors"
                            placeholder="admin@gmail.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2 rounded bg-[#000] border border-gray-800 focus:border-[#0A5CDD] outline-none transition-colors"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && <p className="text-red-400 text-xs text-center">{error}</p>}

                    <button
                        type="submit"
                        className="w-full py-2 bg-[#0A5CDD] hover:bg-[#004bbb] rounded text-sm font-bold transition-colors"
                    >
                        LOGIN
                    </button>
                </form>
            </div>
        </div>
    )
}
