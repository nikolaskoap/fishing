"use client";

import { SpinWheel } from "./SpinWheel";

interface SpinMenuProps {
    tickets: number;
    onSpinSuccess: (amount: number) => void;
    isOpen: boolean;
    onClose: () => void;
}

export function SpinMenu({ tickets, onSpinSuccess, isOpen, onClose }: SpinMenuProps) {
    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-sm bg-[#001226] border border-[#0A5CDD] rounded-xl p-6 shadow-2xl relative flex flex-col items-center">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-400 hover:text-white"
                >
                    ✕
                </button>

                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500 uppercase tracking-wider mb-2">
                    Lucky Spin
                </h3>

                <div className="bg-[#001833] py-2 px-4 rounded-full border border-yellow-500/30 mb-6">
                    <p className="text-yellow-400 text-sm font-bold flex items-center gap-2">
                        🎟️ Tickets: <span className="text-white text-lg">{tickets}</span>
                    </p>
                </div>

                <SpinWheel
                    onWin={onSpinSuccess}
                    tickets={tickets} // Pass to wheel to disable button
                />

                <p className="text-[10px] text-gray-500 text-center mt-6">
                    Get 1 Ticket daily & every Level Up!
                </p>
            </div>
        </div>
    );
}
