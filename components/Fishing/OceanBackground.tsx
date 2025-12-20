'use client'

import React from 'react'

export const OceanBackground = () => {
    return (
        <div className="absolute inset-0 z-0 overflow-hidden bg-gradient-to-b from-blue-900 to-black">
            {/* Sky/Atmosphere */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(20,50,100,0.4),transparent_60%)]"></div>

            {/* Stars/Dust Particles */}
            <div className="absolute inset-0 opacity-30">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute bg-white rounded-full animate-pulse"
                        style={{
                            top: `${Math.random() * 50}%`,
                            left: `${Math.random() * 100}%`,
                            width: `${Math.random() * 3 + 1}px`,
                            height: `${Math.random() * 3 + 1}px`,
                            animationDuration: `${Math.random() * 3 + 2}s`,
                            animationDelay: `${Math.random() * 2}s`
                        }}
                    />
                ))}
            </div>

            {/* Waves Container */}
            <div className="absolute bottom-0 left-0 right-0 h-1/2 flex items-end">
                {/* Wave 1 (Back) */}
                <div className="w-full absolute bottom-8 opacity-40 animate-wave-slow">
                    <svg viewBox="0 0 1440 320" className="w-full h-auto text-blue-800 fill-current">
                        <path d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                    </svg>
                </div>

                {/* Wave 2 (Middle) */}
                <div className="w-full absolute bottom-4 opacity-70 animate-wave-medium">
                    <svg viewBox="0 0 1440 320" className="w-full h-auto text-blue-700 fill-current">
                        <path d="M0,96L48,112C96,128,192,160,288,186.7C384,213,480,235,576,213.3C672,192,768,128,864,128C960,128,1056,192,1152,208C1248,224,1344,192,1392,176L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                    </svg>
                </div>

                {/* Wave 3 (Front) */}
                <div className="w-full absolute bottom-0 opacity-90 animate-wave-fast">
                    <svg viewBox="0 0 1440 320" className="w-full h-auto text-blue-600 fill-current">
                        <path d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,197.3C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                    </svg>
                </div>
            </div>
        </div>
    )
}
