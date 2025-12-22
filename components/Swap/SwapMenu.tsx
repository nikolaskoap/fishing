"use client";

import { useState } from "react";
import { parseUnits } from "viem";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { USDT_ADDRESS, PAYMENT_RECIPIENT, ERC20_ABI } from "@/lib/contracts";

interface SwapMenuProps {
    minedFish: number;
    onSwap: (amount: number) => void;
    isOpen: boolean;
    onClose: () => void;
}

export function SwapMenu({ minedFish, onSwap, isOpen, onClose }: SwapMenuProps) {
    const [swapAmount, setSwapAmount] = useState<string>("");
    const [isSwapping, setIsSwapping] = useState(false);

    // Note: In a real app, this would probably interact with a contract to burn Fish and mint USDC.
    // Here we are just modifying local state and maybe simulating a USDC transfer or just showing UI.
    // The prompt says "Fish = usdc".
    // I will simulate the process.

    const handleSwap = () => {
        const amount = parseFloat(swapAmount);
        if (isNaN(amount) || amount <= 0 || amount > minedFish) return;

        setIsSwapping(true);

        // Simulate network delay
        setTimeout(() => {
            onSwap(amount);
            setIsSwapping(false);
            setSwapAmount("");
            // Optional: Close on success? 
            // onClose(); 
        }, 1500);
    };

    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-sm bg-[#001226] border border-[#0A5CDD] rounded-xl p-6 shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-400 hover:text-white"
                >
                    ✕
                </button>

                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    🔄 Swap Fish to USDC
                </h3>

                <div className="space-y-4">
                    <div className="bg-[#001833] p-4 rounded-lg border border-blue-900/50">
                        <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">Available Balance</label>
                        <div className="text-2xl font-mono text-blue-300">
                            {minedFish.toFixed(4)} <span className="text-sm text-gray-500">FISH</span>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">Amount to Swap</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={swapAmount}
                                onChange={(e) => setSwapAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-[#001833] border border-blue-900 focus:border-[#0A5CDD] rounded-lg p-3 text-white font-mono outline-none transition-colors"
                            />
                            <button
                                onClick={() => setSwapAmount(minedFish.toString())}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-blue-900/50 text-blue-200 px-2 py-1 rounded hover:bg-blue-800 transition-colors"
                            >
                                MAX
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-center text-gray-400 text-sm">
                        ↓ 1 Fish = 1 USDC
                    </div>

                    <div className="bg-[#001833] p-4 rounded-lg border border-green-900/30">
                        <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">You Receive</label>
                        <div className="text-2xl font-mono text-green-400">
                            {parseFloat(swapAmount || "0").toFixed(2)} <span className="text-sm text-gray-500">USDC</span>
                        </div>
                    </div>

                    <button
                        onClick={handleSwap}
                        disabled={isSwapping || parseFloat(swapAmount) > minedFish || parseFloat(swapAmount) <= 0}
                        className={`w-full py-4 rounded-xl font-bold text-lg uppercase tracking-widest transition-all
                            ${isSwapping
                                ? "bg-yellow-600/50 text-yellow-200 cursor-wait animate-pulse"
                                : parseFloat(swapAmount) > minedFish
                                    ? "bg-red-900/50 text-red-300 cursor-not-allowed"
                                    : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-900/20"
                            }
                        `}
                    >
                        {isSwapping ? "Swapping..." : "Confirm Swap"}
                    </button>
                </div>
            </div>
        </div>
    );
}
