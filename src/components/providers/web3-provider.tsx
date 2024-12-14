'use client'

import { createWeb3Modal } from '@web3modal/wagmi/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { http } from 'viem'
import { createConfig } from 'wagmi'
import { useState, useEffect } from 'react'

if (!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
  throw new Error('Missing NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID')
}

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

const metadata = {
  name: 'MemeScanner',
  description: 'Early Memecoin Detection Platform',
  url: 'https://memescanner.xyz',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

const config = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http()
  }
})

function Web3ModalProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    createWeb3Modal({
      wagmiConfig: config,
      projectId,
      themeMode: 'dark',
      metadata
    })
    setReady(true)
  }, [])

  if (!ready) return null

  return children
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Web3ModalProvider>
          {children}
        </Web3ModalProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
