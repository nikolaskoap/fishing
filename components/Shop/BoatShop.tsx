"use client";


import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import { FISHING_RODS, FishingRod } from "@/lib/shop-data";
import { USDT_ADDRESS, PAYMENT_RECIPIENT, ERC20_ABI } from "@/lib/contracts";

export function BoatShop({ currentLevel, onPurchaseSuccess }: { currentLevel: number, onPurchaseSuccess: (level: number) => void }) {
    const { isConnected } = useAccount();
    const { writeContract, data: hash, isPending: isWritePending, error: writeError } = useWriteContract();

    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash,
    });

    const [selectedRod, setSelectedRod] = useState<FishingRod | null>(null);

    // Watch for transaction success
    // We need useEffect to safely trigger parent callback
    const [hasNotified, setHasNotified] = useState(false)

    // Reset hasNotified when selecting new rod
    const handleBuy = (rod: FishingRod) => {
        setSelectedRod(rod);
        setHasNotified(false);
        try {
            writeContract({
                address: USDT_ADDRESS,
                abi: ERC20_ABI,
                functionName: "transfer",
                args: [PAYMENT_RECIPIENT, parseUnits(rod.priceUsdc.toString(), 6)],
            });
        } catch (err) {
            console.error("Transaction failed to start", err);
        }
    };

    // Effect to notify parent on success
    useEffect(() => {
        if (isConfirmed && selectedRod && !hasNotified) {
            // Extract level from ID (e.g. "rod-level-2" -> 2)
            const level = parseInt(selectedRod.id.split('-')[2]);
            onPurchaseSuccess(level);
            setHasNotified(true);
        }
    }, [isConfirmed, selectedRod, hasNotified, onPurchaseSuccess])


    const isPending = isWritePending || isConfirming;

    const getRodLevel = (id: string) => parseInt(id.split('-')[2]);

    return (
        <div className="w-full max-w-md p-4 space-y-4">
            <div className="p-4 rounded-xl bg-[#001226]/80 border border-[#0A5CDD]/20 backdrop-blur-sm">
                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-4 uppercase tracking-wider text-center">
                    Gear Shop 🎣
                </h3>

                {!isConnected && (
                    <div className="text-center text-gray-400 text-sm mb-4">
                        Please connect your wallet to purchase gear.
                    </div>
                )}

                <div className="grid grid-cols-1 gap-3">
                    {FISHING_RODS.map((rod) => {
                        const rodLvl = getRodLevel(rod.id);
                        const isOwned = currentLevel >= rodLvl;
                        const isLower = currentLevel > rodLvl;

                        return (
                            <div
                                key={rod.id}
                                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${isOwned ? 'bg-green-900/20 border-green-800' : 'bg-[#001833] border-[#1e3a8a] hover:border-[#0A5CDD]'}`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="text-3xl bg-[#002b4d] p-2 rounded-lg">{rod.image}</div>
                                    <div>
                                        <h4 className="font-bold text-gray-200">
                                            {rod.name}
                                            {isOwned && <span className="ml-2 text-xs text-green-400"> (Owned)</span>}
                                        </h4>
                                        <p className="text-xs text-gray-400">{rod.description}</p>
                                        <p className="text-xs text-green-400 mt-1">Mining: +{rod.miningBonus}/hr</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleBuy(rod)}
                                    disabled={!isConnected || isPending || isOwned}
                                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all
                  ${!isConnected
                                            ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                                            : isOwned
                                                ? "bg-green-800/50 text-green-400 cursor-default"
                                                : isPending
                                                    ? "bg-yellow-600/50 text-yellow-200 cursor-wait"
                                                    : "bg-gradient-to-r from-[#0A5CDD] to-[#0091FF] text-white hover:shadow-[0_0_10px_#0A5CDD]"
                                        }
`}
                                >
                                    {isOwned
                                        ? "Owned"
                                        : isPending && selectedRod?.id === rod.id
                                            ? "Buying..."
                                            : `${rod.priceUsdc} USDC`
                                    }
                                </button>
                            </div>
                        )
                    })}
                </div>

                {writeError && (
                    <div className="mt-4 p-3 rounded-lg bg-red-900/50 border border-red-800 text-red-200 text-xs break-all">
                        Error: {writeError.message.split(".")[0]}
                    </div>
                )}

                {isConfirmed && selectedRod && (
                    <div className="mt-4 p-3 rounded-lg bg-green-900/50 border border-green-800 text-green-200 text-sm text-center">
                        🎉 Successfully purchased {selectedRod.name}!
                        <br />
                        <span className="text-xs text-gray-300">Your mining rate has increased!</span>
                    </div>
                )}
            </div>
        </div>
    );
}
