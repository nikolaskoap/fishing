'use client'

import React from 'react';

export default function AutoCaster() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Fishing Rod Animation */}
      <div className="relative w-full h-[300px] pointer-events-none">
        <div className="absolute bottom-[-20px] left-[-20px] w-48 h-48 md:w-64 md:h-64 animate-[rod_5s_ease-in-out_infinite] origin-bottom-left">
          <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_0_20px_rgba(34,211,238,0.3)]">
            {/* Rod */}
            <path
              d="M20,180 L180,20"
              stroke="url(#rodGradient)"
              strokeWidth="6"
              strokeLinecap="round"
              className="animate-[bend_5s_ease-in-out_infinite]"
            />
            {/* Fishing Line */}
            <path
              d="M180,20 Q190,100 100,150"
              stroke="white"
              strokeWidth="1"
              fill="none"
              strokeDasharray="4 2"
              className="animate-[line_5s_ease-in-out_infinite] opacity-60"
            />
            {/* Lure/Hook */}
            <circle cx="100" cy="150" r="4" fill="#ef4444" className="animate-[bob_5s_ease-in-out_infinite] shadow-lg" />

            <defs>
              <linearGradient id="rodGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#78350f" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      <style jsx>{`
        @keyframes rod {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-15deg); }
          30% { transform: rotate(10deg); }
          70% { transform: rotate(5deg); }
        }
        @keyframes bend {
          0%, 100% { d: path("M20,180 L180,20"); }
          25% { d: path("M20,180 Q100,100 180,20"); }
          30% { d: path("M20,180 Q120,80 180,20"); }
        }
        @keyframes line {
          0%, 100% { d: path("M180,20 Q190,100 100,150"); opacity: 0.2; }
          20% { d: path("M180,20 Q150,50 160,20"); opacity: 0; }
          30% { d: path("M180,20 Q250,150 120,180"); opacity: 1; }
          70% { d: path("M180,20 Q190,120 100,160"); opacity: 0.6; }
        }
        @keyframes bob {
          0%, 100% { transform: translate(0, 0); }
          30% { transform: translate(20px, 30px); }
          50% { transform: translate(0, 0); }
          70% { transform: translate(5px, 10px); }
        }
      `}</style>
    </div>
  );
}
