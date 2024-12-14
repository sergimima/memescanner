import { defaultWagmiConfig } from '@web3modal/wagmi'
import { arbitrum, base, bsc, mainnet, polygon } from 'wagmi/chains'
import { type Chain } from 'viem'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

if (!projectId) {
  console.warn('Missing NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID')
}

export const metadata = {
  name: 'MemeScanner',
  description: 'Early Memecoin Detection Platform',
  url: 'https://memescanner.xyz',
  icons: ['https://memescanner.xyz/icon.png']
}

export const chains = [mainnet, bsc, polygon, arbitrum, base] as const

export const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
})
