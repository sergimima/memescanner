import { BaseChainService } from './base-chain'
import { TokenBase, TokenAnalysis, TokenScore } from '../types/token'
import { createPublicClient, http, parseAbi } from 'viem'
import { bsc } from 'viem/chains'
import axios from 'axios'
import { BSC_RPC_URLS, getRandomRPC } from '@/config/rpc'

// ABI mínimo para verificar tokens
const ERC20_ABI = parseAbi([
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function owner() view returns (address)',
])

// ABI para PancakeSwap Factory
const PANCAKESWAP_FACTORY_ABI = parseAbi([
  'function getPair(address tokenA, address tokenB) view returns (address pair)',
])

// ABI para PancakeSwap Pair
const PANCAKE_PAIR_ABI = parseAbi([
  'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
])

// Direcciones importantes en BSC
const ADDRESSES = {
  WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
  PANCAKE_FACTORY: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
  PANCAKE_ROUTER: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
  DEAD_WALLET: '0x000000000000000000000000000000000000dEaD',
  BURN_WALLET: '0x0000000000000000000000000000000000000000',
  ZERO_ADDRESS: '0x0000000000000000000000000000000000000000',
} as const

interface BSCScanEvent {
  topics: string[];
  timeStamp: string;
  data: string;
  blockNumber: string;
  transactionHash: string;
}

interface TokenEvent {
  address: string;
  timeStamp: string;
  topics: string[];
}

export class BSCChainService extends BaseChainService {
  readonly chainId = '56'
  readonly chainName = 'bsc'
  readonly scanApiUrl = 'https://api.bscscan.com/api'
  readonly scanApiKey = process.env.NEXT_PUBLIC_BSCSCAN_API_KEY || ''

  private client: ReturnType<typeof createPublicClient> | null = null

  private createClient() {
    try {
      if (!this.client) {
        this.client = createPublicClient({
          chain: bsc,
          transport: http(getRandomRPC(BSC_RPC_URLS)),
          batch: {
            multicall: true
          }
        })
      }
      return this.client
    } catch (error) {
      console.error('Error creando el cliente RPC:', error)
      throw new Error('No se pudo crear el cliente RPC')
    }
  }

  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<T> {
    let lastError: any
    for (let i = 0; i < maxRetries; i++) {
      try {
        // Crear un nuevo cliente en cada intento
        this.client = null
        const client = this.createClient()
        if (!client) {
          throw new Error('No se pudo crear el cliente RPC')
        }
        return await fn()
      } catch (error: any) {
        lastError = error
        console.warn(`Intento ${i + 1}/${maxRetries} falló:`, error.message)
        if (i < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, i)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    throw lastError
  }

  private async getLatestTokenEvents(): Promise<TokenEvent[]> {
    try {
      const response = await axios.get(this.scanApiUrl, {
        params: {
          module: 'logs',
          action: 'getLogs',
          address: ADDRESSES.PANCAKE_FACTORY,
          topic0: '0x0d3648bd0f6ba80134a33ba9275ac585d9d315f0ad8355cddefde31afa28d0e9', // PairCreated event
          startblock: 0,
          endblock: 99999999,
          page: 1,
          offset: 10, // Reducir a 10 pares (20 tokens potenciales)
          sort: 'desc',
          apikey: this.scanApiKey
        }
      })

      if (!response.data.result || !Array.isArray(response.data.result)) {
        console.error('Respuesta inválida de BSCScan:', response.data)
        return []
      }

      return response.data.result.map((event: BSCScanEvent) => ({
        address: event.topics[1], // token0
        timeStamp: event.timeStamp,
        topics: event.topics
      }))
    } catch (error) {
      console.error('Error obteniendo eventos:', error)
      return []
    }
  }

  async getNewTokens(): Promise<TokenBase[]> {
    try {
      const events = await this.getLatestTokenEvents()
      console.log(`Encontrados ${events.length} eventos de nuevos tokens`)

      // Extraer las direcciones de los tokens de los eventos
      const addresses = events.flatMap(event => {
        const token0 = '0x' + event.topics[1].slice(26)
        const token1 = '0x' + event.topics[2].slice(26)
        return [token0, token1]
      }).filter(address => 
        address.toLowerCase() !== ADDRESSES.WBNB.toLowerCase() &&
        address.toLowerCase() !== ADDRESSES.PANCAKE_FACTORY.toLowerCase()
      )

      const uniqueAddresses = [...new Set(addresses)]
      console.log(`Procesando ${uniqueAddresses.length} direcciones únicas`)

      const tokens: TokenBase[] = []
      const batchSize = 3 // Procesar tokens en lotes pequeños
      
      for (let i = 0; i < uniqueAddresses.length; i += batchSize) {
        const batch = uniqueAddresses.slice(i, i + batchSize)
        const batchPromises = batch.map(async (address: string) => {
          try {
            const tokenData = await this.getTokenData(address)
            if (!this.isValidToken(tokenData)) {
              console.warn(`Token incompleto en ${address}: name=${tokenData.name}, symbol=${tokenData.symbol}, decimals=${tokenData.decimals}, totalSupply=${tokenData.totalSupply}`)
              return null
            }

            const analysis = await this.analyzeToken(address)
            const score = this.calculateScore(analysis)

            return {
              ...tokenData,
              network: this.chainName,
              createdAt: new Date(),
              score,
              analysis
            }
          } catch (error) {
            console.error(`Error procesando token ${address}:`, error)
            return null
          }
        })

        const batchResults = await Promise.all(batchPromises)
        const validTokens = batchResults.filter((token): token is TokenBase => token !== null)
        tokens.push(...validTokens)

        if (i + batchSize < uniqueAddresses.length) {
          await this.delay(2000) // Esperar 2 segundos entre lotes
        }
      }

      return tokens
    } catch (error) {
      console.error('Error getting new tokens:', error)
      return []
    }
  }

  private async getTokenData(address: string): Promise<Partial<TokenBase>> {
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      console.warn(`Dirección inválida: ${address}`)
      return {}
    }

    return this.retryWithBackoff(async () => {
      try {
        const client = this.createClient()
        const [nameResult, symbolResult, decimalsResult, totalSupplyResult] = await Promise.all([
          client.readContract({
            address: address as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'name'
          }).catch(() => null),
          client.readContract({
            address: address as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'symbol'
          }).catch(() => null),
          client.readContract({
            address: address as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'decimals'
          }).catch(() => null),
          client.readContract({
            address: address as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'totalSupply'
          }).catch(() => null)
        ])

        if (!nameResult || !symbolResult || decimalsResult === null || totalSupplyResult === null) {
          console.warn(`Token incompleto en ${address}: name=${nameResult}, symbol=${symbolResult}, decimals=${decimalsResult}, totalSupply=${totalSupplyResult}`)
          return {}
        }

        // Convertir los resultados a los tipos correctos
        const name = nameResult.toString()
        const symbol = symbolResult.toString()
        const decimals = Number(decimalsResult)
        const totalSupply = totalSupplyResult.toString()

        // Validaciones adicionales
        if (!name || !symbol || isNaN(decimals) || !totalSupply) {
          console.warn(`Token con datos inválidos en ${address}`)
          return {}
        }

        return {
          address,
          name,
          symbol,
          decimals,
          totalSupply
        }
      } catch (error) {
        console.error(`Error obteniendo datos del token ${address}:`, error)
        return {}
      }
    }, 5) // Aumentar el número máximo de reintentos a 5
  }

  private isValidToken(token: Partial<TokenBase>): token is Required<Pick<TokenBase, 'address' | 'name' | 'symbol' | 'decimals' | 'totalSupply'>> {
    return (
      typeof token.address === 'string' &&
      typeof token.name === 'string' &&
      token.name.length > 0 &&
      typeof token.symbol === 'string' &&
      token.symbol.length > 0 &&
      typeof token.decimals === 'number' &&
      token.decimals >= 0 &&
      token.decimals <= 18 &&
      typeof token.totalSupply === 'string' &&
      token.totalSupply.length > 0
    )
  }

  calculateScore(analysis: TokenAnalysis): TokenScore {
    const score = this.calculateBaseScore(analysis)
    return {
      ...score,
      // Aquí podemos agregar lógica específica de BSC para ajustar el score
      total: score.total
    }
  }

  public async analyzeToken(address: string): Promise<TokenAnalysis> {
    // Análisis básico
    const analysis: TokenAnalysis = {
      liquidityUSD: 0,
      holders: [], // Inicializar como array vacío
      buyCount: 0,
      sellCount: 0,
      marketCap: 0,
      price: 0,
      lockedLiquidity: {
        percentage: 0,
        until: new Date(),
        verified: false
      },
      ownership: {
        renounced: false,
        isMultisig: false
      },
      contract: {
        verified: false,
        hasHoneypot: false,
        hasUnlimitedMint: false,
        hasTradingPause: false,
        maxTaxPercentage: 0,
        hasDangerousFunctions: false
      },
      distribution: {
        maxWalletPercentage: 0,
        teamWalletPercentage: 0,
        top10HoldersPercentage: 0
      },
      social: {
        telegram: undefined,
        twitter: undefined,
        website: undefined,
        followers: 0,
        engagement: 0,
        sentiment: {
          positive: 0,
          neutral: 0,
          negative: 0
        }
      },
      liquidityLocked: false,
      liquidityLockDuration: undefined,
      liquidityLockPlatform: undefined
    }

    try {
      // Obtener holders
      const holdersResponse = await this.getHolders(address)
      analysis.holders = holdersResponse.map(holder => ({
        address: holder.address,
        balance: holder.balance,
        percentage: holder.percentage
      }))

      // Resto del análisis...
      return analysis
    } catch (error) {
      console.error('Error analizando el token:', error)
      return analysis
    }
  }

  private async getHolders(address: string) {
    return this.retryWithBackoff(async () => {
      try {
        // TODO: Implementar obtención real de datos de holders
        return [
          {
            address: '0x1234567890abcdef',
            balance: '1000000000000000000',
            percentage: 50
          },
          {
            address: '0x9876543210fedcba',
            balance: '500000000000000000',
            percentage: 25
          }
        ]
      } catch (error) {
        console.error(`Error obteniendo datos de holders para ${address}:`, error)
        return []
      }
    }, 5)
  }

  private async getLiquidityData(address: string) {
    return this.retryWithBackoff(async () => {
      try {
        const client = this.createClient()
        const pairAddress = await client.readContract({
          address: ADDRESSES.PANCAKE_FACTORY as `0x${string}`,
          abi: PANCAKESWAP_FACTORY_ABI,
          functionName: 'getPair',
          args: [address as `0x${string}`, ADDRESSES.WBNB as `0x${string}`]
        })

        if (!pairAddress || pairAddress === ADDRESSES.ZERO_ADDRESS) {
          return {
            hasLiquidity: false,
            liquidityBNB: '0'
          }
        }

        const reserves = await client.readContract({
          address: pairAddress as `0x${string}`,
          abi: PANCAKE_PAIR_ABI,
          functionName: 'getReserves'
        })

        if (!reserves || !reserves[0] || !reserves[1]) {
          return {
            hasLiquidity: false,
            liquidityBNB: '0'
          }
        }

        return {
          hasLiquidity: true,
          liquidityBNB: reserves[1].toString()
        }
      } catch (error) {
        console.error(`Error obteniendo datos de liquidez para ${address}:`, error)
        return {
          hasLiquidity: false,
          liquidityBNB: '0'
        }
      }
    }, 5)
  }

  private async getContractData(address: string) {
    // Implementar verificación de contrato
    return {
      contract: {
        verified: false,
        hasHoneypot: false,
        hasUnlimitedMint: false,
        hasTradingPause: false,
        maxTaxPercentage: 0
      },
      ownership: {
        renounced: false,
        isMultisig: false
      }
    }
  }

  private async getDistributionData(address: string) {
    // Implementar análisis de distribución de tokens
    return {
      distribution: {
        maxWalletPercentage: 0,
        teamWalletPercentage: 0,
        top10HoldersPercentage: 0
      }
    }
  }

  private async getSocialData(address: string) {
    // TODO: Implementar búsqueda de redes sociales
    return {
      telegram: undefined,
      twitter: undefined,
      website: undefined,
      followers: 0,
      engagement: 0
    }
  }

  public getTokenContract(address: string) {
    const client = this.createClient()
    if (!client) {
      throw new Error('No se pudo crear el cliente RPC')
    }
    return {
      name: async () => client.readContract({
        address: address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'name'
      }),
      symbol: async () => client.readContract({
        address: address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'symbol'
      }),
      decimals: async () => client.readContract({
        address: address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'decimals'
      }),
      totalSupply: async () => client.readContract({
        address: address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'totalSupply'
      })
    }
  }
}
