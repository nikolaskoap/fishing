'use client'

import React from 'react'

interface MenuDrawerProps {
    isOpen: boolean
    onClose: () => void
    onOpenSwap: () => void
    onOpenSpin: () => void
    onOpenStats: () => void
    onOpenInvite: () => void
}

export function MenuDrawer({
    isOpen,
    onClose,
    onOpenSwap,
    onOpenSpin,
    onOpenStats,
    onOpenInvite
}: MenuDrawerProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex animate-fade-in">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Drawer Content */}
            <div className="relative w-64 h-full bg-[#0c4a6e] border-r border-white/10 shadow-2xl flex flex-col p-6 animate-slide-in-left">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-2xl opacity-50 hover:opacity-100"
                >
                    ✕
                </button>

                <div className="flex items-center gap-3 mb-10 mt-4">
                    <div className="w-10 h-10 bg-cyan-400 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-cyan-400/20">🎣</div>
                    <span className="font-black text-lg tracking-tighter">BASE FISHING</span>
                </div>

                <nav className="flex-1 space-y-2">
                    <MenuButton icon="🔄" label="Swap (USDC)" onClick={() => { onOpenSwap(); onClose(); }} />
                    <MenuButton icon="🎡" label="Lucky Spin" onClick={() => { onOpenSpin(); onClose(); }} />
                    <MenuButton icon="📊" label="Statistics" onClick={() => { onOpenStats(); onClose(); }} />
                    <MenuButton icon="👥" label="Invite & Earn" onClick={() => { onOpenInvite(); onClose(); }} />
                    <MenuButton icon="🎒" label="Inventory" onClick={() => onClose()} />
                </nav>

                <div className="pt-6 border-t border-white/5 space-y-4">
                    <div className="bg-black/20 p-4 rounded-xl">
                        <p className="text-[10px] font-black opacity-30 uppercase tracking-widest mb-1">Status</p>
                        <p className="text-xs font-bold text-green-400 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Online
                        </p>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes slide-in-left {
                    from { transform: translateX(-100%); }
                    to { transform: translateX(0); }
                }
                .animate-slide-in-left {
                    animation: slide-in-left 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    )
}

function MenuButton({ icon, label, onClick }: { icon: string, label: string, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors text-left group"
        >
            <span className="text-xl group-hover:scale-110 transition-transform">{icon}</span>
            <span className="font-bold text-sm opacity-80 group-hover:opacity-100">{label}</span>
        </button>
    )
}
