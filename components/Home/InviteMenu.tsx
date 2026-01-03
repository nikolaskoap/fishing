'use client'

import React, { useState } from 'react'

interface InviteMenuProps {
    isOpen: boolean
    onClose: () => void
    referralCount: number
    fid?: number
}

export function InviteMenu({ isOpen, onClose, referralCount, fid }: InviteMenuProps) {
    const [copied, setCopied] = useState(false)

    if (!isOpen) return null

    const referralLink = `https://base-fishing.vercel.app/?ref=${fid}`
    const inviteLink = `https://warpcast.com/~/compose?text=Join me on Base Fishing!&embeds[]=${referralLink}`

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(referralLink)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative w-full max-w-sm bg-[#0c4a6e] border-2 border-[#0ea5e9]/30 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden">
                <button onClick={onClose} className="absolute top-6 right-6 text-xl opacity-50 hover:opacity-100 transition-opacity">✕</button>

                <h2 className="text-2xl font-black italic text-white mb-2 tracking-tighter">INVITE & EARN</h2>
                <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest mb-8">Share the catch with friends</p>

                <div className="bg-black/30 p-6 rounded-[2rem] border border-white/10 mb-6 text-center">
                    <p className="text-[10px] font-black opacity-40 uppercase mb-2">Your Referrals</p>
                    <p className="text-5xl font-black italic text-white">{referralCount}</p>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                        <span className="text-2xl">🎟️</span>
                        <div>
                            <p className="text-xs font-black">LUCKY TICKET</p>
                            <p className="text-[10px] opacity-40">Get 1 spin for every 3 invites</p>
                        </div>
                    </div>

                    {/* Referral Link Display with Copy Button */}
                    <div className="bg-black/30 p-4 rounded-2xl border border-white/10">
                        <p className="text-[8px] font-black opacity-40 uppercase mb-2">Your Referral Link</p>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={referralLink}
                                readOnly
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] font-mono text-white/70 focus:outline-none focus:border-cyan-400/50"
                            />
                            <button
                                onClick={handleCopy}
                                className={`px-3 py-2 rounded-lg font-black text-[10px] transition-all ${copied
                                        ? 'bg-green-500 text-black'
                                        : 'bg-cyan-500 hover:bg-cyan-400 text-black'
                                    }`}
                            >
                                {copied ? '✓' : '📋'}
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={() => window.open(inviteLink, '_blank')}
                        className="w-full bg-[#4ADE80] hover:bg-[#22C55E] p-4 rounded-2xl font-black text-black border-b-4 border-[#166534] active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2"
                    >
                        <span>SHARE TO WARPCAST</span>
                        <span className="text-xl">🚀</span>
                    </button>
                </div>

                <p className="mt-6 text-[8px] text-center opacity-30 font-bold uppercase">Referral bonuses are credited automatically</p>
            </div>
        </div>
    )
}
