export const BSC_RPC_URLS = [
  'https://bsc-dataseed1.binance.org',
  'https://bsc-dataseed2.binance.org',
  'https://bsc-dataseed3.binance.org',
  'https://bsc-dataseed4.binance.org',
  'https://bsc.publicnode.com',
  'https://endpoints.omniatech.io/v1/bsc/mainnet/public',
  'https://rpc.ankr.com/bsc'
]

export function getRandomRPC(urls: string[]): string {
  return urls[Math.floor(Math.random() * urls.length)]
}
