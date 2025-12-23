'use client'

import { useState, useRef, useEffect } from 'react'

interface SpinWheelProps {
    onWin: (amount: number) => void
    tickets: number
}

const WHEEL_ORDER = [32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26, 0];
const RED_NUMBERS = [32, 19, 21, 25, 34, 27, 36, 30, 23, 5, 16, 1, 14, 9, 18, 7, 12, 3];

// Map specific Roulette Numbers to Prizes
// User requested: 0.5, 0.05, 1, 5, 10, 100. Rest 0.
// We map these to specific numbers on the wheel to distribute them.
const PRIZE_VALUES: Record<number, number> = {
    0: 100,   // Green Zero = Jackpot
    32: 10,   // Red
    15: 0,    // Black (0)
    19: 5,    // Red
    4: 0, 21: 0.5, 2: 1, 25: 0, 17: 0.5, 34: 0,
    6: 0.5, 27: 0.05, 13: 0.5, 36: 0.05, 11: 0, 30: 0.05,
    8: 0.5, 23: 0, 10: 0.5, 5: 0, 24: 0.5, 16: 0,
    33: 0.5, 1: 0.05, 20: 0.5, 14: 0.05, 31: 0.5, 9: 0,
    22: 0.5, 18: 0, 29: 0.5, 7: 0.05, 28: 0.5, 12: 0,
    35: 0.5, 3: 0.05, 26: 0.5
    // Any undefined will defaults to 0 in logic below if missed
};

// Map of Number -> Angle (from LESS .spinto mixins)
const ANGLE_MAP: Record<number, number> = {
    1: 278, 2: 106, 3: 30, 4: 87, 5: 238, 6: 146, 7: 354, 8: 207, 9: 316, 10: 228,
    11: 187, 12: 12, 13: 166, 14: 298, 15: 67, 16: 258, 17: 125, 18: 335, 19: 77, 20: 288,
    21: 96, 22: 326, 23: 218, 24: 248, 25: 116, 26: 40, 27: 156, 28: 3, 29: 345, 30: 196,
    31: 307, 32: 58, 33: 268, 34: 135, 35: 381, 36: 177, 0: 49
};

export function SpinWheel({ onWin, tickets }: SpinWheelProps) {
    const [isSpinning, setIsSpinning] = useState(false)
    const [result, setResult] = useState<{ num: number, val: number, color: string } | null>(null)
    const [ballRotation, setBallRotation] = useState<number>(0)
    const [isResting, setIsResting] = useState(false)
    const [history, setHistory] = useState<{ val: number, color: string }[]>([])

    // Logic to spin
    const spin = () => {
        if (isSpinning || tickets <= 0) return

        setIsSpinning(true)
        setIsResting(false)
        setResult(null)

        // --- RIGGED PROBABILITY LOGIC ---
        // User wants: 
        // 50% chance for '0' (Try Again)
        // 50% chance for WINNING
        //   - If WINNING: 50% (of win) = 0.05, 49.9% (of win) = 0.5, 0.1% (of win) = Rare [1, 5, 10, 100]

        const rand = Math.random() * 100
        let winningPrize = 0

        if (rand < 50) {
            winningPrize = 0
        } else {
            const winRand = Math.random() * 100
            if (winRand < 50) {
                winningPrize = 0.05
            } else if (winRand < 99.9) {
                winningPrize = 0.5
            } else {
                // Rare prizes
                const rares = [1, 5, 10, 100]
                winningPrize = rares[Math.floor(Math.random() * rares.length)]
            }
        }

        // Find slots that have this prize
        const matchingSlots = WHEEL_ORDER.filter(num => PRIZE_VALUES[num] === winningPrize)
        // Fallback (shouldn't happen)
        const chosenNum = matchingSlots.length > 0
            ? matchingSlots[Math.floor(Math.random() * matchingSlots.length)]
            : 15

        const angle = ANGLE_MAP[chosenNum] || 0
        const spins = 8
        const targetRotation = (360 * -spins) + angle

        setBallRotation(targetRotation)

        // Animation Time (9s)
        setTimeout(() => {
            const color = chosenNum === 0 ? 'green' : RED_NUMBERS.includes(chosenNum) ? 'red' : 'black'

            setResult({ num: chosenNum, val: winningPrize, color })
            setIsResting(true) // trigger ball rest position
            setIsSpinning(false)

            onWin(winningPrize)

            setHistory(prev => [{ val: winningPrize, color }, ...prev].slice(0, 5))

        }, 9000)
    }

    const reset = () => {
        setIsResting(false)
        setResult(null)
        setBallRotation(0)
    }

    return (
        <div className="flex flex-col items-center justify-center p-4 w-full overflow-hidden relative">

            <style jsx>{`
                .plate {
                    width: 300px;
                    height: 300px;
                    background-color: gray;
                    border-radius: 50%;
                    position: relative;
                    margin: 20px auto;
                    animation: rotate 24s infinite linear;
                    box-shadow: 0 0 0 10px #333, 0 0 0 12px gold;
                }
                .plate:before {
                    content: '';
                    position: absolute;
                    top: 12%; left: 12%; right: 12%; bottom: 12%;
                    border: 1px solid silver;
                    border-radius: 50%;
                    background: rgba(0,0,0,0.65);
                    z-index: 1;
                }
                .number {
                    width: 32px;
                    height: 150px; /* half of plate */
                    position: absolute;
                    top: 0;
                    left: calc(50% - 16px);
                    transform-origin: 50% 100%;
                    text-align: center;
                    border-top: 150px solid black;
                    border-left: 16px solid transparent;
                    border-right: 16px solid transparent;
                    box-sizing: border-box;
                    z-index: 0;
                }
                .number:nth-child(odd) {
                    border-top-color: #D00; /* Red */
                }
                .number:nth-child(37) { /* 0 usually green, but here index 37 is 0? */
                    border-top-color: green;
                }
                .pit {
                    color: #fff;
                    padding-top: 12px;
                    display: block;
                    font-size: 12px;
                    transform: scale(1, 1.8);
                    position: absolute;
                    top: -150px;
                    left: -16px;
                    width: 32px;
                    text-align: center;
                }
                .inner {
                    width: 100%;
                    height: 100%;
                    display: block;
                    position: relative;
                    list-style: none;
                    margin: 0; padding: 0;
                }
                .inner:after { /* Center piece */
                    content: '';
                    position: absolute;
                    z-index: 3;
                    top: 24%; left: 24%; right: 24%; bottom: 24%;
                    background: #222;
                    border: 3px solid #111;
                    border-radius: 50%;
                }
                /* The Ball */
                .ball {
                    position: absolute;
                    top: 24%; 
                    bottom: 21%;
                    left: 24%;
                    right: 22%;
                    border-radius: 50%;
                    z-index: 5;
                    pointer-events: none;
                    transition: transform 9s ease-out;
                }
                .ball:after {
                    content: '•';
                    color: white;
                    font-size: 40px;
                    display: block;
                    position: absolute;
                    top: -15px; 
                }
                .inner.rest .ball {
                     /* Logic handled via transform in JS, but maybe position adjustment? */
                     /* User CSS says: top: 25%; right: 25%; ... transition top... */
                     /* We will simulate 'rest' by just keeping the ball at the rotation. */
                }

                @keyframes rotate {
                    0% { transform: rotateZ(0deg); }
                    100% { transform: rotateZ(360deg); }
                }

                /* Data Reveal */
                .data {
                    position: absolute;
                    top: 30%; left: 30%; right: 30%; bottom: 30%;
                    z-index: 100;
                    perspective: 2000px;
                    animation: rotate 24s reverse linear infinite; /* Counter rotate to stay upright */
                }
                .data-inner {
                    position: relative;
                    width: 100%; height: 100%;
                    text-align: center;
                    transition: transform 0.7s;
                    transform-style: preserve-3d;
                }
                .data.reveal .data-inner {
                    transform: rotateY(180deg);
                }
                .data .mask, .data .result {
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    backface-visibility: hidden;
                    border-radius: 50%;
                    display: flex;
                    flex-col;
                    justify-content: center;
                    align-items: center;
                }
                .mask { color: #fff; font-size: 14px; padding: 10px; background: transparent; }
                .result {
                    transform: rotateY(180deg);
                    background: green;
                    flex-direction: column;
                }
                .result-number { font-size: 48px; font-weight: bold; line-height: 1; }
                .result-color { font-size: 14px; text-transform: uppercase; }

            `}</style>

            <div className="main transform scale-75 md:scale-100">
                <div className="plate">
                    <ul className={`inner ${isResting ? 'rest' : ''}`}>
                        {WHEEL_ORDER.map((num, i) => (
                            <li
                                key={num}
                                className="number"
                                style={{
                                    transform: `rotateZ(${i * (360 / 37)}deg)`,
                                    borderTopColor: num === 0 ? 'green' : (i % 2 === 0 ? 'red' : 'black')
                                    // Logic for color: CSS used nth-child(odd) -> red.
                                    // My WHEEL_ORDER has 37 items.
                                    // 32 (idx 0) -> Odd child (1st) -> Red.
                                    // 15 (idx 1) -> Even child (2nd) -> Black.
                                    // Let's use i % 2 === 0 for Red (1st child is index 0 in JS but child 1 in CSS).
                                    // Wait, 1st child (index 0) is Red.
                                    // 2nd child (index 1) is Black.
                                    // 37th child (index 36) is Green (0).
                                }}
                            >
                                <span className="pit" style={{ transform: 'scale(1, 2) translateY(-5px)', fontSize: '10px' }}>
                                    {PRIZE_VALUES[num] ?? 0}
                                </span>
                            </li>
                        ))}

                        {/* The Ball */}
                        <div
                            className="ball"
                            style={{
                                transform: `rotateZ(${ballRotation}deg)`,
                            }}
                        />
                    </ul>

                    {/* Center Data Display (Counter-Rotating) */}
                    <div className={`data ${result ? 'reveal' : ''}`}>
                        <div className="data-inner">
                            <div className="mask flex items-center justify-center h-full">
                                <span className="pt-8">Place Bets</span>
                            </div>
                            <div className="result" style={{ backgroundColor: result?.color === 'red' ? '#D00' : result?.color === 'black' ? '#222' : 'green' }}>
                                <div className="result-number" style={{ fontSize: result && result.val < 1 ? '32px' : '48px' }}>
                                    {result?.val}
                                </div>
                                <div className="result-color" style={{ fontSize: '12px' }}>{result?.val === 0 ? 'TRY AGAIN' : 'WIN!'}</div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <div className="w-full max-w-xs space-y-4 z-10">
                <button
                    onClick={spin}
                    disabled={isSpinning || tickets <= 0}
                    className={`
                        w-full py-4 rounded-xl font-bold text-xl uppercase tracking-widest transition-all transform active:scale-95 shadow-lg
                        ${isSpinning || tickets <= 0
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed border border-gray-600'
                            : 'bg-green-600 hover:bg-green-500 text-white border-2 border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.4)]'
                        }
                    `}
                >
                    {isSpinning ? 'SPINNING...' : 'SPIN'}
                </button>

                {isResting && (
                    <button onClick={reset} className="w-full py-2 bg-gray-800 text-gray-300 rounded-lg text-xs uppercase tracking-wider hover:bg-gray-700">
                        New Game
                    </button>
                )}

                {/* Previous Results */}
                {history.length > 0 && (
                    <div className="flex justify-center gap-2 mt-2">
                        {history.map((h, i) => (
                            <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white border border-white/20 shadow-md ${h.color === 'red' ? 'bg-red-600' : h.color === 'black' ? 'bg-black' : 'bg-green-600'}`}>
                                {h.val}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

