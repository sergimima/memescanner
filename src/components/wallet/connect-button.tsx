"use client"

import { useWeb3Modal } from '@web3modal/wagmi/react'
import { Button } from '@/components/ui/button'
import { useAccount } from 'wagmi'

export function ConnectButton() {
  const { open } = useWeb3Modal()
  const { address, isConnected } = useAccount()

  if (!isConnected) {
    return (
      <Button 
        onClick={() => open()}
        className="bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-500 dark:to-blue-500 text-white hover:opacity-90"
      >
        Conectar Wallet
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => open()}
        className="hover:bg-red-50 dark:hover:bg-red-950"
      >
        {address?.slice(0, 6)}...{address?.slice(-4)}
      </Button>
    </div>
  )
}
