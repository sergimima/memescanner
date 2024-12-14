"use client"

import { createWeb3Modal } from '@web3modal/wagmi/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { wagmiConfig } from '@/config/web3modal'

const queryClient = new QueryClient()

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

if (!projectId) {
  throw new Error('Missing NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID environment variable')
}

createWeb3Modal({
  wagmiConfig,
  projectId,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-font-family': 'Inter, sans-serif',
    '--w3m-accent': '#6366f1',
    '--w3m-border-radius-master': '0.5rem'
  },
  metadata: {
    name: 'MemeScanner',
    description: 'Early Memecoin Detection Platform',
    url: 'https://memescanner.vercel.app',
    icons: ['https://memescanner.vercel.app/icon.png']
  },
  featuredWalletIds: ['c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96'],
  includeWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust
    '225affb176778569276e484e1b92637ad061b01e13a048b35a9d280c3b58970f', // Safe
  ]
})

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
