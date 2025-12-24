import { useFrame } from '@/components/farcaster-provider'
import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector'
import { useAppKit } from '@reown/appkit/react'
import {
  useAccount,
  useConnect,
  useDisconnect,
} from 'wagmi'

export function WalletActions() {
  const { isEthProviderAvailable } = useFrame()
  const { isConnected, address } = useAccount()
  const { disconnect } = useDisconnect()
  const { connect } = useConnect()
  const { open } = useAppKit()

  if (isConnected) {
    return (
      <div className="w-full relative group transform transition-all hover:scale-[1.01]">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-xl opacity-30 group-hover:opacity-60 transition duration-500 blur-sm"></div>
        <div className="relative flex items-center justify-between p-4 bg-[#001226] border border-[#0A5CDD]/30 rounded-xl">
          <div className="flex flex-col">
            <span className="text-[#A3B3C2] text-[10px] uppercase tracking-widest font-bold mb-1">Active Wallet</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 font-mono text-sm font-bold">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
            </div>
          </div>
          <button
            onClick={() => disconnect()}
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-red-500/20 transition-all hover:border-red-500/50 hover:text-red-400"
          >
            Disconnect
          </button>
        </div>
      </div>
    )
  }

  // Not Connected State
  return (
    <div className="w-full relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl opacity-20 group-hover:opacity-40 transition duration-500 blur-sm"></div>
      <button
        type="button"
        className="relative w-full bg-[#001226] hover:bg-[#001a35] text-white rounded-xl p-4 border border-[#0A5CDD]/30 transition-all flex items-center justify-center gap-2 group-hover:border-[#0A5CDD]/60"
        onClick={() => {
          if (isEthProviderAvailable) {
            connect({ connector: miniAppConnector() })
          } else {
            open?.()
          }
        }}
      >
        <span className="text-xl">🔗</span>
        <span className="font-bold text-sm uppercase tracking-wider">Connect Wallet</span>
      </button>
    </div>
  )
}

