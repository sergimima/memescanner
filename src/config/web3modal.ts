import { defaultWagmiConfig } from '@web3modal/wagmi'
import { arbitrum, base, bsc, mainnet, polygon } from 'wagmi/chains'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
console.log('Config Project ID:', projectId)

if (!projectId) {
  throw new Error('Missing NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID environment variable')
}

export const metadata = {
  name: 'MemeScanner',
  description: 'Early Memecoin Detection Platform',
  url: 'https://memescanner.vercel.app',
  icons: ['https://memescanner.vercel.app/icon.png']
}

export const chains = [mainnet, bsc, polygon, arbitrum, base] as const

export const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  enableWalletConnect: true,
  enableInjected: true,
  enableEIP6963: true,
  enableCoinbase: true,
})
