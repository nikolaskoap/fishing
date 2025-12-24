import AutoCaster from './AutoCaster'

export function FishingGame({
  activeBoatLevel = 0,
  currentRate = 0,
  isMuted = false
}: {
  activeBoatLevel: number
  currentRate: number
  isMuted?: boolean
}) {
  return (
    <div className="relative w-full h-full min-h-[350px] bg-sky-900/10 overflow-hidden">
      {/* Visual Animation */}
      <AutoCaster />

      {/* Rarity Info Dashboard (Floating) */}
      <div className="absolute top-4 left-4 z-30 flex flex-col gap-1">
        <p className="text-[8px] text-gray-500 uppercase font-bold mb-1">Active Mode</p>
        <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-3 py-2 rounded-xl border border-white/5">
          <span className="text-xl">{activeBoatLevel === 0 ? '🛶' : activeBoatLevel === 1 ? '🚤' : activeBoatLevel === 2 ? '🚢' : '🛳️'}</span>
          <div>
            <p className="text-[10px] text-white font-black leading-tight">BOAT LEVEL {activeBoatLevel}</p>
            <p className="text-[8px] text-cyan-400 font-mono font-bold uppercase tracking-tighter">{currentRate} FISH/HR</p>
          </div>
        </div>
      </div>

      {/* Ambient VFX */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-cyan-500/10 to-transparent"></div>
        <div className="absolute top-0 right-0 p-4 opacity-20">
          <div className="w-16 h-1 bg-white rounded-full blur-sm"></div>
        </div>
      </div>
    </div>
  )
}

