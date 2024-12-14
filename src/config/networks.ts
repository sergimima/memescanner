export type NetworkId = 'ethereum' | 'solana' | 'bsc' | 'base' | 'arbitrum'

export interface Network {
  id: NetworkId
  name: string
  rpc: string
  symbol: string
  explorer: string
  isTestnet?: boolean
}

export const networks: Network[] = [
  {
    id: 'solana',
    name: 'Solana',
    rpc: process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.mainnet-beta.solana.com',
    symbol: 'SOL',
    explorer: 'https://solscan.io'
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    rpc: process.env.NEXT_PUBLIC_ETHEREUM_RPC || 'https://eth.llamarpc.com',
    symbol: 'ETH',
    explorer: 'https://etherscan.io'
  },
  {
    id: 'bsc',
    name: 'BSC',
    rpc: process.env.NEXT_PUBLIC_BSC_RPC || 'https://bsc-dataseed1.binance.org',
    symbol: 'BNB',
    explorer: 'https://bscscan.com'
  },
  {
    id: 'base',
    name: 'Base',
    rpc: process.env.NEXT_PUBLIC_BASE_RPC || 'https://mainnet.base.org',
    symbol: 'ETH',
    explorer: 'https://basescan.org'
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum',
    rpc: process.env.NEXT_PUBLIC_ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc',
    symbol: 'ETH',
    explorer: 'https://arbiscan.io'
  }
]

export const getNetwork = (id: NetworkId) => networks.find(network => network.id === id)
