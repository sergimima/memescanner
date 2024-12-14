'use client'

import { useWeb3Modal } from '@web3modal/wagmi/react'
import { Button } from '../ui/button'
import { useAccount } from 'wagmi'
import { useState, useEffect } from 'react'

export function ConnectButton() {
  const [mounted, setMounted] = useState(false)
  const { address, isConnected } = useAccount()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <Button variant="outline">Connect Wallet</Button>
  }

  const { open } = useWeb3Modal()

  return (
    <Button
      onClick={() => open()}
      variant="outline"
    >
      {isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Connect Wallet'}
    </Button>
  )
}
