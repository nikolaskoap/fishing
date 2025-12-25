'use client'

import React from 'react';

export default function AutoCaster({ isActive = false }: { isActive?: boolean }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Fishing Rod Animation */}
      <div className="relative w-full h-[400px] pointer-events-none">
        <div
          className={`absolute bottom-[-40px] left-[-20px] w-64 h-64 md:w-80 md:h-80 origin-bottom-left transition-transform duration-1000
            ${isActive ? 'animate-rod-cast' : 'rotate-[-30deg]'}`}
        >
          <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_0_20px_rgba(34,211,238,0.4)]">
            {/* Rod with better bend */}
            <path
              d="M20,180 Q60,140 180,20"
              stroke="url(#rodGradient)"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
              className={isActive ? "animate-rod-bend" : ""}
            />
            {/* Fishing Line with better arc */}
            <path
              d="M180,20 Q190,100 120,160"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="0.8"
              fill="none"
              strokeDasharray="4 2"
              className={`transition-opacity duration-1000 ${isActive ? 'animate-line-arc' : 'opacity-0'}`}
            />
            {/* Lure/Hook with splash */}
            {isActive && (
              <g className="animate-bobber">
                <circle cx="120" cy="160" r="4" fill="#ef4444" className="shadow-lg" />
                <circle cx="120" cy="160" r="8" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" className="animate-ping" />
              </g>
            )}

            <defs>
              <linearGradient id="rodGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#451a03" />
                <stop offset="50%" stopColor="#92400e" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      <style jsx>{`
        .animate-rod-cast {
          animation: rod-cast 4s ease-in-out infinite;
        }
        .animate-rod-bend {
          animation: rod-bend 4s ease-in-out infinite;
        }
        .animate-line-arc {
          animation: line-arc 4s ease-in-out infinite;
        }
        .animate-bobber {
          animation: bobber 4s ease-in-out infinite;
        }

        @keyframes rod-cast {
          0%, 100% { transform: rotate(0deg); }
          15% { transform: rotate(-25deg); }
          25% { transform: rotate(15deg); }
          50% { transform: rotate(10deg); }
          80% { transform: rotate(5deg); }
        }

        @keyframes rod-bend {
          0%, 100% { d: path("M20,180 Q60,140 180,20"); }
          15% { d: path("M20,180 Q40,160 180,20"); }
          25% { d: path("M20,180 Q140,80 180,20"); }
          50% { d: path("M20,180 Q100,100 180,20"); }
        }

        @keyframes line-arc {
          0%, 100% { d: path("M180,20 Q190,100 120,160"); opacity: 0.4; }
          15% { d: path("M180,20 Q150,50 160,20"); opacity: 0; }
          25% { d: path("M180,20 Q240,140 140,180"); opacity: 0.8; }
          50% { d: path("M180,20 Q190,120 120,165"); opacity: 1; }
        }

        @keyframes bobber {
          0%, 100% { transform: translate(0, 0); }
          15% { transform: translate(40px, -100px); opacity: 0; }
          25% { transform: translate(20px, 20px); opacity: 1; }
          50% { transform: translate(0, 5px); }
          75% { transform: translate(0, -2px); }
        }
      `}</style>
    </div>
  );
}
