import { BaseChainService } from './base-chain'
import { TokenBase, TokenAnalysis, TokenScore } from '../types/token'
import { createPublicClient, http, encodeFunctionData, decodeFunctionResult } from 'viem'
import { bsc } from 'viem/chains'
import axios from 'axios'
import { BSC_RPC_URLS, getRandomRPC } from '@/config/rpc'
import { WebSocketService } from './websocket-service'
import { ethers } from 'ethers';

// ABI mínimo para verificar tokens
const ERC20_ABI = [
  {
    "inputs": [],
    "name": "name",
    "outputs": [{ "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{ "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{ "type": "uint8" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{ "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// ABI para PancakeSwap Factory
const FACTORY_ABI = [
  {
    "inputs": [
      { "type": "address" },
      { "type": "address" }
    ],
    "name": "getPair",
    "outputs": [{ "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// ABI para PancakeSwap Pair
const PAIR_ABI = [
  {
    "inputs": [],
    "name": "getReserves",
    "outputs": [
      { "type": "uint112" },
      { "type": "uint112" },
      { "type": "uint32" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "token0",
    "outputs": [{ "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// ABI para PancakeSwap Router
const PANCAKESWAP_ROUTER_ABI = [
  {
    "inputs": [
      { "type": "uint" },
      { "type": "address[]" }
    ],
    "name": "getAmountsOut",
    "outputs": [{ "type": "uint[]" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// ABI para Multicall3
const MULTICALL3_ABI = [
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "target",
            "type": "address"
          },
          {
            "internalType": "bytes",
            "name": "callData",
            "type": "bytes"
          }
        ],
        "internalType": "struct Multicall3.Call[]",
        "name": "calls",
        "type": "tuple[]"
      }
    ],
    "name": "aggregate",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "blockNumber",
        "type": "uint256"
      },
      {
        "internalType": "bytes[]",
        "name": "returnData",
        "type": "bytes[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Direcciones importantes en BSC
const ADDRESSES = {
  WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
  PANCAKE_FACTORY: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
  PANCAKE_ROUTER: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
  DEAD_WALLET: '0x000000000000000000000000000000000000dEaD',
  BURN_WALLET: '0x0000000000000000000000000000000000000000',
  ZERO_ADDRESS: '0x0000000000000000000000000000000000000000',
  MULTICALL3: '0xcA11bde05977b3631167028862bE2a173976CA11'
} as const

interface BSCScanEvent {
  topics: string[];
  timeStamp: string;
  data: string;
  blockNumber: string;
  transactionHash: string;
  token0?: string;
  token1?: string;
  pairAddress?: string;
}

interface TokenEvent {
  address: string;
  timeStamp: string;
  topics: string[];
}

interface Holder {
  address: string;
  balance: string;
  percentage: number;
}

const KNOWN_LOCKERS = [
  '0x0000000000000000000000000000000000000000', // PinkSale
  // Agregar más direcciones de lockers conocidos aquí
];

interface MulticallResult {
  returnData: readonly `0x${string}`[];
  blockNumber: bigint;
}

interface PairMulticallResult {
  returnData: readonly `0x${string}`[];
  blockNumber: bigint;
}

type DecodedData<T> = { result: T };

export class BSCChainService extends BaseChainService {
  private static instance: BSCChainService | null = null;
  readonly chainId = '56';
  readonly chainName = 'BSC';
  readonly scanApiUrl = 'https://api.bscscan.com/api';
  readonly scanApiKey = process.env.NEXT_PUBLIC_BSCSCAN_API_KEY || '';
  private wsService: WebSocketService;
  private processedTransactions = new Set<string>();
  private client: ReturnType<typeof createPublicClient> | null = null;
  private readonly STORAGE_KEY = 'bsc_tokens';
  private provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_BSC_RPC_URL);
  private analysisQueue: string[] = [];
  private isProcessingQueue = false;
  private readonly CONCURRENT_REQUESTS = 1;
  private readonly DELAY_BETWEEN_REQUESTS = 2000;
  private tokens: TokenBase[] = [];
  private analysisCache: Record<string, { timestamp: number; data: TokenAnalysis }> = {};
  private readonly CACHE_DURATION = 5 * 60 * 1000;

  private constructor() {
    super();
    this.processedTransactions = new Set();
    this.chainName = 'BSC';
    this.STORAGE_KEY = 'bsc_tokens';
    this.provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_BSC_RPC_URL);
    this.wsService = new WebSocketService();
    
    // Cargar caché de análisis
    try {
      const cachedAnalysis = localStorage.getItem('analysis_cache');
      if (cachedAnalysis) {
        this.analysisCache = JSON.parse(cachedAnalysis);
      }
    } catch (error) {
      console.error('Error cargando caché de análisis:', error);
    }

    // Solo cargar tokens guardados sin análisis
    this.loadSavedTokens().then(tokens => {
      this.tokens = tokens;
    }).catch(error => {
      console.error('Error cargando tokens guardados:', error);
    });
  }

  public static getInstance(): BSCChainService {
    if (!BSCChainService.instance) {
      BSCChainService.instance = new BSCChainService();
    }
    return BSCChainService.instance;
  }

  private async loadSavedTokens(): Promise<TokenBase[]> {
    const savedTokensJson = localStorage.getItem(this.STORAGE_KEY);
    let savedTokens: TokenBase[] = [];
    
    try {
      savedTokens = savedTokensJson ? JSON.parse(savedTokensJson) : [];
      if (!Array.isArray(savedTokens)) {
        console.warn(`Tokens guardados no es un array, reseteando`);
        savedTokens = [];
      }
    } catch (e) {
      console.warn(`Error parseando tokens guardados, reseteando:`, e);
      savedTokens = [];
    }

    return savedTokens;
  }

  private async saveToken(token: TokenBase) {
    try {
      const tokens = await this.loadSavedTokens();
      const existingTokenIndex = tokens.findIndex(
        (t: TokenBase) => t.address.toLowerCase() === token.address.toLowerCase()
      );

      if (existingTokenIndex !== -1) {
        // Si el token ya existe, actualizar
        tokens[existingTokenIndex] = {
          ...tokens[existingTokenIndex],
          ...token,
          updatedAt: new Date()
        } as TokenBase;
      } else {
        // Si es un nuevo token, añadir al principio
        tokens.unshift(token);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tokens));
      console.log(`Token ${existingTokenIndex === -1 ? 'guardado' : 'actualizado'}:`, token.address);

      // Emitir evento para actualizar la UI
      const loadedTokensEvent = new CustomEvent('tokensLoaded', {
        detail: { tokens }
      });
      window.dispatchEvent(loadedTokensEvent);
    } catch (error) {
      console.error(`Error guardando token:`, error);
    }
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

  private createClient() {
    if (!this.client) {
      this.client = createPublicClient({
        chain: bsc,
        transport: http('/api/bscscan/rpc')  // Usar el proxy en la misma estructura que holders
      })
    }
    return this.client
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
      if (axios.isAxiosError(error)) {
        console.error('Error cargando datos de la API:', error.response ? error.response.data : error.message);
      } else {
        console.error('Error desconocido:', error);
      }
      return []
    }
  }

  async getNewTokens(): Promise<TokenBase[]> {
    // Temporalmente deshabilitado para probar WebSocket
    console.log('[POLLING] Método deshabilitado temporalmente para pruebas de WebSocket');
    return [];
    
    /* try {
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
    } */
  }

  private async getTokenData(address: string): Promise<Partial<TokenBase>> {
    const cacheKey = `token_data_${address.toLowerCase()}`;
    const cachedData = localStorage.getItem(cacheKey);
    
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      const cacheAge = Date.now() - parsed.timestamp;
      if (cacheAge < 5 * 60 * 1000) {
        return parsed.data;
      }
    }

    try {
      const client = this.createClient();

      // Intentar primero con multicall
      try {
        const calls = [
          {
            target: address as `0x${string}`,
            callData: encodeFunctionData({
              abi: ERC20_ABI,
              functionName: 'name',
              args: [] as const
            })
          },
          {
            target: address as `0x${string}`,
            callData: encodeFunctionData({
              abi: ERC20_ABI,
              functionName: 'symbol',
              args: [] as const
            })
          },
          {
            target: address as `0x${string}`,
            callData: encodeFunctionData({
              abi: ERC20_ABI,
              functionName: 'decimals',
              args: [] as const
            })
          },
          {
            target: address as `0x${string}`,
            callData: encodeFunctionData({
              abi: ERC20_ABI,
              functionName: 'totalSupply',
              args: [] as const
            })
          }
        ];

        const multicallResult = await client.readContract({
          address: ADDRESSES.MULTICALL3 as `0x${string}`,
          abi: MULTICALL3_ABI,
          functionName: 'aggregate',
          args: [calls]
        }) as MulticallResult;

        if (multicallResult?.returnData && Array.isArray(multicallResult.returnData) && multicallResult.returnData.length === 4) {
          const decodedResults = {
            name: decodeFunctionResult({
              abi: ERC20_ABI,
              functionName: 'name',
              data: multicallResult.returnData[0]
            }) as string,
            symbol: decodeFunctionResult({
              abi: ERC20_ABI,
              functionName: 'symbol',
              data: multicallResult.returnData[1]
            }) as string,
            decimals: decodeFunctionResult({
              abi: ERC20_ABI,
              functionName: 'decimals',
              data: multicallResult.returnData[2]
            }) as number,
            totalSupply: decodeFunctionResult({
              abi: ERC20_ABI,
              functionName: 'totalSupply',
              data: multicallResult.returnData[3]
            }) as bigint
          };

          if (decodedResults.name && decodedResults.symbol && typeof decodedResults.decimals === 'number') {
            const tokenData: Partial<TokenBase> = {
              address,
              name: decodedResults.name as string,
              symbol: decodedResults.symbol as string,
              decimals: decodedResults.decimals,
              totalSupply: decodedResults.totalSupply.toString(),
              network: this.chainName,
              createdAt: new Date()
            };

            localStorage.setItem(cacheKey, JSON.stringify({
              data: tokenData,
              timestamp: Date.now()
            }));

            return tokenData;
          }
        }
        throw new Error('Multicall incompleto');
      } catch (multicallError) {
        console.log(`[getTokenData] Multicall falló para ${address}, intentando llamadas individuales`);
        
        // Si multicall falla, intentar llamadas individuales
        try {
          const [name, symbol, decimals, totalSupply] = await Promise.all([
            client.readContract({
              address: address as `0x${string}`,
              abi: ERC20_ABI,
              functionName: 'name',
            }).catch(() => null) as Promise<string | null>,
            client.readContract({
              address: address as `0x${string}`,
              abi: ERC20_ABI,
              functionName: 'symbol',
            }).catch(() => null) as Promise<string | null>,
            client.readContract({
              address: address as `0x${string}`,
              abi: ERC20_ABI,
              functionName: 'decimals',
            }).catch(() => null) as Promise<number | null>,
            client.readContract({
              address: address as `0x${string}`,
              abi: ERC20_ABI,
              functionName: 'totalSupply',
            }).catch(() => null) as Promise<bigint | null>
          ]);

          if (name && symbol && typeof decimals === 'number') {
            const tokenData: Partial<TokenBase> = {
              address,
              name: name as string,
              symbol: symbol as string,
              decimals,
              totalSupply: totalSupply ? totalSupply.toString() : '0',
              network: this.chainName,
              createdAt: new Date()
            };

            localStorage.setItem(cacheKey, JSON.stringify({
              data: tokenData,
              timestamp: Date.now()
            }));

            return tokenData;
          }
        } catch (individualError) {
          console.error(`[getTokenData] Error en llamadas individuales para ${address}:`, individualError);
        }
      }
    } catch (error) {
      console.error(`[getTokenData] Error general obteniendo datos del token ${address}:`, error);
    }

    return { address };
  }

  public calculateScore(analysis: TokenAnalysis): TokenScore {
    // Calcular puntuación base
    let score = {
      security: 0,
      liquidity: 0,
      community: 0,
      total: 0
    };

    // Puntuación de seguridad (40% del total)
    if (analysis.contract?.verified) score.security += 15;
    if (!analysis.contract?.hasHoneypot) score.security += 10;
    if (!analysis.contract?.hasUnlimitedMint) score.security += 5;
    if (!analysis.contract?.hasTradingPause) score.security += 5;
    if ((analysis.contract?.maxTaxPercentage || 0) <= 5) score.security += 5;
    
    // Puntuación de liquidez (30% del total)
    const liquidityScore = Math.min(analysis.liquidityUSD / 10000, 15); // Max 15 puntos por liquidez
    score.liquidity += liquidityScore;
    
    if (analysis.liquidityLocked) {
      score.liquidity += 10;
      const lockDuration = analysis.liquidityLockDuration ? 
        Number(analysis.liquidityLockDuration) : 0;
      if (lockDuration > 180) {
        score.liquidity += 5;
      }
    }

    // Puntuación de comunidad (30% del total)
    if (analysis.social?.telegram) score.community += 5;
    if (analysis.social?.twitter) score.community += 5;
    if (analysis.social?.website) score.community += 5;
    if ((analysis.social?.followers || 0) > 1000) score.community += 5;
    if ((analysis.social?.engagement || 0) > 0.1) score.community += 5;

    // Calcular puntuación total (ponderada)
    score.total = (
      (score.security * 0.4) + 
      (score.liquidity * 0.3) + 
      (score.community * 0.3)
    );

    return score;
  }

  public async analyzeToken(address: string): Promise<TokenAnalysis> {
    address = address.toLowerCase();
    console.log(`[Análisis] Iniciando análisis para token:`, address);
    
    const cached = this.analysisCache[address];
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`[Análisis] Usando datos en caché para ${address}`);
      return cached.data;
    }

    try {
      console.log(`[Análisis] Obteniendo datos de liquidez...`);
      const liquidityData = await this.getLiquidityData(address);
      console.log(`[Análisis] Datos de liquidez:`, liquidityData);
      await this.delay(this.DELAY_BETWEEN_REQUESTS);
      
      console.log(`[Análisis] Obteniendo holders...`);
      const holdersData = await this.getHolders(address);
      console.log(`[Análisis] Holders encontrados:`, holdersData?.length || 0);
      await this.delay(this.DELAY_BETWEEN_REQUESTS);
      
      console.log(`[Análisis] Obteniendo datos del contrato...`);
      const contractData = await this.getContractData(address);
      await this.delay(this.DELAY_BETWEEN_REQUESTS);
      
      console.log(`[Análisis] Obteniendo datos de distribución...`);
      const distributionData = await this.getDistributionData(address);
      await this.delay(this.DELAY_BETWEEN_REQUESTS);
      
      console.log(`[Análisis] Obteniendo datos sociales...`);
      const socialData = await this.getSocialData(address);

      const tokenContract = this.getTokenContract(address);
      console.log(`[Análisis] Obteniendo supply y decimales...`);
      const [totalSupplyBN, decimals] = await Promise.all([
        tokenContract.totalSupply() as Promise<bigint>,
        tokenContract.decimals() as Promise<number>
      ]);

      console.log(`[Análisis] Supply:`, totalSupplyBN.toString(), `Decimales:`, decimals);
      const adjustedSupply = Number(totalSupplyBN.toString()) / Math.pow(10, decimals);
      console.log(`[Análisis] Supply ajustado:`, adjustedSupply);
      
      // Calcular precio usando la liquidez
      const reserves = await this.getTokenReserves(address);
      console.log(`[Análisis] Reservas:`, reserves);
      
      let price = 0;
      let liquidityUSD = 0;
      
      if (reserves?.tokenReserve && reserves?.bnbReserve) {
        const bnbPriceResponse = await axios.get('https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT');
        const bnbPrice = parseFloat(bnbPriceResponse.data.price);
        console.log(`[Análisis] Precio BNB:`, bnbPrice);
        
        // Precio = (BNB Reserve * BNB Price) / Token Reserve
        // Ajustar por decimales: BNB tiene 18 decimales, el token puede tener diferentes
        const bnbValue = (Number(reserves.bnbReserve) / 1e18) * bnbPrice;
        const tokenValue = Number(reserves.tokenReserve) / Math.pow(10, Number(decimals));
        price = bnbValue / tokenValue;
        liquidityUSD = bnbValue * 2; // Multiplicamos por 2 porque el valor de la liquidez es el doble del valor de BNB
        
        console.log(`[Análisis] Cálculo de precio:`, {
          bnbReserve: reserves.bnbReserve,
          tokenReserve: reserves.tokenReserve,
          bnbPrice,
          decimals,
          bnbValue,
          tokenValue,
          price,
          liquidityUSD
        });

        // Convertir el precio a string con precisión completa
        const priceString = price.toFixed(18);
        console.log(`[Análisis] Precio como string:`, priceString);
        
        console.log(`[Análisis] Precio calculado:`, price);
        const marketCap = price * adjustedSupply;
        console.log(`[Análisis] Market Cap calculado:`, marketCap);

        const analysis: TokenAnalysis = {
          liquidityUSD,
          holders: holdersData || [],
          buyCount: 0,
          sellCount: 0,
          marketCap,
          price: price.toFixed(18),
          lockedLiquidity: {
            percentage: Number(liquidityData?.lockedLiquidity?.percentage || 0),
            until: liquidityData?.lockedLiquidity?.until ? new Date(liquidityData.lockedLiquidity.until) : new Date(),
            verified: Boolean(liquidityData?.liquidityLocked)
          },
          ownership: {
            renounced: Boolean(contractData?.ownership?.renounced),
            isMultisig: Boolean(contractData?.ownership?.isMultisig)
          },
          contract: {
            verified: Boolean(contractData?.contract?.verified),
            hasHoneypot: Boolean(contractData?.contract?.hasHoneypot),
            hasUnlimitedMint: Boolean(contractData?.contract?.hasUnlimitedMint),
            hasTradingPause: Boolean(contractData?.contract?.hasTradingPause),
            maxTaxPercentage: Number(contractData?.contract?.maxTaxPercentage || 0),
            hasDangerousFunctions: Boolean(contractData?.contract?.hasDangerousFunctions)
          },
          distribution: {
            maxWalletPercentage: Number(distributionData?.distribution?.maxWalletPercentage || 0),
            teamWalletPercentage: Number(distributionData?.distribution?.teamWalletPercentage || 0),
            top10HoldersPercentage: Number(distributionData?.distribution?.top10HoldersPercentage || 0)
          },
          social: socialData || {},
          liquidityLocked: Boolean(liquidityData?.liquidityLocked),
          liquidityLockDuration: liquidityData?.lockedLiquidity?.until ? 
            Math.floor((new Date(liquidityData.lockedLiquidity.until).getTime() - Date.now()) / (1000 * 60 * 60 * 24)).toString() : undefined,
          liquidityLockPlatform: liquidityData?.liquidityLocked ? 'PinkSale' : undefined
        };

        this.analysisCache[address] = {
          timestamp: Date.now(),
          data: analysis
        };

        try {
          localStorage.setItem('analysis_cache', JSON.stringify(this.analysisCache));
        } catch (error) {
          console.error('Error guardando caché de análisis:', error);
        }

        console.log(`[Análisis] Análisis completado:`, analysis);
        return analysis;
      } else {
        console.log(`[Análisis] No se encontraron reservas`);
        return {
          liquidityUSD: 0,
          holders: [],
          buyCount: 0,
          sellCount: 0,
          marketCap: 0,
          price: '0',
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
            engagement: 0
          },
          liquidityLocked: false,
          liquidityLockDuration: undefined,
          liquidityLockPlatform: undefined
        };
      }
    } catch (error) {
      console.error(`[Análisis] Error analizando token:`, error);
      throw error;
    }
  }

  private async isTokenTradeable(address: string): Promise<boolean> {
    try {
      const client = this.createClient();
      
      // Primero verificamos si existe el par en PancakeSwap
      const pairCall = {
        target: ADDRESSES.PANCAKE_FACTORY as `0x${string}`,
        callData: encodeFunctionData({
          abi: FACTORY_ABI,
          functionName: 'getPair',
          args: [address as `0x${string}`, ADDRESSES.WBNB as `0x${string}`]
        }) as `0x${string}`
      };

      const pairResult = await client.readContract({
        address: ADDRESSES.PANCAKE_FACTORY as `0x${string}`,
        abi: FACTORY_ABI,
        functionName: 'getPair',
        args: [address as `0x${string}`, ADDRESSES.WBNB as `0x${string}`]
      }) as `0x${string}`;

      if (!pairResult || pairResult === ADDRESSES.ZERO_ADDRESS) {
        return false;
      }

      // Verificar si la liquidez está bloqueada
      const liquidityLockInfo = await this.isLiquidityLocked(pairResult);
      console.log(`[Liquidez] Info de liquidez bloqueada:`, liquidityLockInfo);
      
      const reserves = await client.readContract({
        address: pairResult,
        abi: PAIR_ABI,
        functionName: 'getReserves',
        args: [] as readonly []
      }) as [bigint, bigint, number];

      const token0Address = await client.readContract({
        address: pairResult,
        abi: PAIR_ABI,
        functionName: 'token0',
        args: [] as readonly []
      }) as `0x${string}`;

      if (!reserves || !token0Address) {
        return false;
      }

      const bnbPriceResponse = await axios.get('https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT');
      const bnbPrice = parseFloat(bnbPriceResponse.data.price);

      const liquidityBNB = reserves[1].toString();
      const liquidityUSD = (Number(liquidityBNB) / 1e18) * bnbPrice;

      return true;
    } catch {
      return false;
    }
  }

  private async isLiquidityLocked(pairAddress: string): Promise<{
    isLocked: boolean;
    percentage?: number;
    until?: string;
  }> {
    try {
      // Verificar en PinkSale
      const pinkLockResponse = await axios.get(`${this.scanApiUrl}`, {
        params: {
          module: 'account',
          action: 'tokentx',
          address: pairAddress,
          apikey: this.scanApiKey
        }
      });

      if (pinkLockResponse.data.status === '1') {
        const transfers = pinkLockResponse.data.result;
        const lockTransfers = transfers.filter((tx: any) => 
          KNOWN_LOCKERS.includes(tx.to.toLowerCase())
        );

        if (lockTransfers.length > 0) {
          const latestLock = lockTransfers[0];
          return {
            isLocked: true,
            percentage: 100, // Por defecto asumimos 100%, esto debería refinarse
            until: new Date(parseInt(latestLock.timeStamp) * 1000 + (365 * 24 * 60 * 60 * 1000)).toISOString() // Asumimos 1 año
          };
        }
      }

      return { isLocked: false };
    } catch (error) {
      console.error('Error verificando liquidez bloqueada:', error);
      return { isLocked: false };
    }
  }

  private async getLiquidityData(address: string) {
    return this.retryWithBackoff(async () => {
      try {
        const client = this.createClient();
        console.log(`[Liquidez] Buscando par para el token:`, address);
        
        // Verificar si el token se puede tradear
        const canTrade = await this.isTokenTradeable(address);
        console.log(`[Liquidez] ¿Se puede tradear?:`, canTrade);
        
        const pairResult = await client.readContract({
          address: ADDRESSES.PANCAKE_FACTORY as `0x${string}`,
          abi: FACTORY_ABI,
          functionName: 'getPair',
          args: [address as `0x${string}`, ADDRESSES.WBNB as `0x${string}`]
        }) as `0x${string}`;

        if (!pairResult || pairResult === ADDRESSES.ZERO_ADDRESS) {
          console.log(`[Liquidez] No se encontró par de liquidez para ${address}`);
          return {
            hasLiquidity: false,
            liquidityBNB: '0',
            liquidityUSD: 0,
            liquidityLocked: false
          };
        }

        const pairAddress = pairResult;

        // Verificar si la liquidez está bloqueada
        const liquidityLockInfo = await this.isLiquidityLocked(pairAddress);
        console.log(`[Liquidez] Info de liquidez bloqueada:`, liquidityLockInfo);
        
        const reserves = await client.readContract({
          address: pairAddress,
          abi: PAIR_ABI,
          functionName: 'getReserves',
          args: [] as readonly []
        }) as [bigint, bigint, number];

        if (!reserves || !reserves[0] || !reserves[1]) {
          return {
            hasLiquidity: false,
            liquidityBNB: '0',
            liquidityUSD: 0,
            liquidityLocked: false
          };
        }

        const bnbPriceResponse = await axios.get('https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT');
        const bnbPrice = parseFloat(bnbPriceResponse.data.price);

        const liquidityBNB = reserves[1].toString();
        const liquidityUSD = (Number(liquidityBNB) / 1e18) * bnbPrice;

        return {
          hasLiquidity: true,
          liquidityBNB,
          liquidityUSD,
          liquidityLocked: liquidityLockInfo.isLocked,
          lockedLiquidity: liquidityLockInfo.isLocked ? {
            percentage: liquidityLockInfo.percentage || 0,
            until: liquidityLockInfo.until || 'N/A',
            verified: true
          } : undefined
        };
      } catch (error) {
        console.error(`Error obteniendo datos de liquidez:`, error);
        return {
          hasLiquidity: false,
          liquidityBNB: '0',
          liquidityUSD: 0,
          liquidityLocked: false
        };
      }
    }, 5);
  }

  async getTokenReserves(address: string): Promise<{
    tokenReserve: string | null;
    bnbReserve: string | null;
  }> {
    try {
      const client = this.createClient();

      // Primero verificamos si existe el par en PancakeSwap
      const pairResult = await client.readContract({
        address: ADDRESSES.PANCAKE_FACTORY as `0x${string}`,
        abi: FACTORY_ABI,
        functionName: 'getPair',
        args: [address as `0x${string}`, ADDRESSES.WBNB as `0x${string}`]
      }) as `0x${string}`;

      if (!pairResult || pairResult === ADDRESSES.ZERO_ADDRESS) {
        console.log(`[Liquidez] No se encontró par de liquidez para ${address}`);
        return { tokenReserve: null, bnbReserve: null };
      }

      // Obtenemos las reservas y el token0
      const [reserves, token0] = await Promise.all([
        client.readContract({
          address: pairResult,
          abi: PAIR_ABI,
          functionName: 'getReserves',
          args: [] as readonly []
        }) as Promise<[bigint, bigint, number]>,
        client.readContract({
          address: pairResult,
          abi: PAIR_ABI,
          functionName: 'token0',
          args: [] as readonly []
        }) as Promise<`0x${string}`>
      ]);

      if (!reserves || !token0) {
        console.log(`[Liquidez] No se pudieron obtener las reservas para ${address}`);
        return { tokenReserve: null, bnbReserve: null };
      }

      const [reserve0, reserve1] = reserves;
      const isToken0 = token0.toLowerCase() === address.toLowerCase();

      return {
        tokenReserve: (isToken0 ? reserve0 : reserve1).toString(),
        bnbReserve: (isToken0 ? reserve1 : reserve0).toString()
      };
    } catch (error) {
      console.error('Error obteniendo reservas:', error);
      return { tokenReserve: null, bnbReserve: null };
    }
  }

  private async getContractData(address: string) {
    // Implementar verificación de contrato
    return {
      contract: {
        verified: false,
        hasHoneypot: false,
        hasUnlimitedMint: false,
        hasTradingPause: false,
        maxTaxPercentage: 0,
        hasDangerousFunctions: false
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

  private async getHolders(address: string) {
    return this.retryWithBackoff(async () => {
      try {
        console.log(`[Holders] Obteniendo holders para ${address}`);
        const response = await axios.get(this.scanApiUrl, {
          params: {
            module: 'token',
            action: 'tokenholderlist',
            contractaddress: address,
            page: 1,
            offset: 100,
            apikey: this.scanApiKey
          }
        });

        console.log(`[Holders] Respuesta de la API:`, response.data);

        if (response.data.status === '1' && Array.isArray(response.data.result)) {
          const tokenContract = this.getTokenContract(address);
          const [totalSupplyBN, decimals] = await Promise.all([
            tokenContract.totalSupply() as Promise<bigint>,
            tokenContract.decimals() as Promise<number>
          ]);
          
          const totalSupply = BigInt(totalSupplyBN.toString());
          const holders = response.data.result
            .filter((holder: any) => 
              holder.address.toLowerCase() !== ADDRESSES.DEAD_WALLET.toLowerCase() &&
              holder.address.toLowerCase() !== ADDRESSES.BURN_WALLET.toLowerCase() &&
              holder.address.toLowerCase() !== ADDRESSES.ZERO_ADDRESS.toLowerCase()
            )
            .map((holder: any) => {
              const balance = BigInt(holder.TokenHolderQuantity);
              const percentage = Number((balance * BigInt(10000) / totalSupply)) / 100;
              
              return {
                address: holder.TokenHolderAddress,
                balance: holder.TokenHolderQuantity,
                percentage
              };
            });

          console.log(`[Holders] Holders procesados:`, holders.length);
          return holders;
        }
        
        console.log(`[Holders] No se encontraron holders válidos`);
        return [];
      } catch (error) {
        console.error('[Holders] Error obteniendo holders:', error);
        return [];
      }
    }, 5);
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
        functionName: 'name',
        args: [] as readonly []
      }),
      symbol: async () => client.readContract({
        address: address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'symbol',
        args: [] as readonly []
      }),
      decimals: async () => client.readContract({
        address: address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'decimals',
        args: [] as readonly []
      }),
      totalSupply: async () => client.readContract({
        address: address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'totalSupply',
        args: [] as readonly []
      })
    }
  }

  private async processAnalysisQueue() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    try {
      while (this.analysisQueue.length > 0) {
        const address = this.analysisQueue.shift();
        if (!address) continue;

        // Verificar si ya existe en caché y es válido
        const cached = this.analysisCache[address];
        if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
          continue;
        }

        try {
          const analysis = await this.analyzeToken(address);
          const score = this.calculateScore(analysis);
          await this.updateTokenAnalysis(address, analysis, score);
          await new Promise(resolve => setTimeout(resolve, this.DELAY_BETWEEN_REQUESTS));
        } catch (error) {
          console.error(`Error procesando token ${address}:`, error);
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  public async queueTokenAnalysis(address: string) {
    // Normalizar la dirección
    address = address.toLowerCase();
    
    // Verificar si el token ya está en la cola o está siendo procesado
    if (this.analysisQueue.includes(address)) {
      console.log(`Token ${address} ya está en la cola de análisis`);
      return;
    }

    // Verificar si el token tiene un análisis reciente en caché
    const cached = this.analysisCache[address];
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`Usando análisis en caché para: ${address}`);
      return;
    }

    console.log(`Añadiendo token ${address} a la cola de análisis`);
    this.analysisQueue.push(address);
    
    // Iniciar el procesamiento si no está en curso
    if (!this.isProcessingQueue) {
      this.processAnalysisQueue();
    }
  }

  private async updateTokenAnalysis(address: string, analysis: TokenAnalysis, score: TokenScore) {
    try {
      const tokenData = await this.getTokenData(address);
      
      // Verificar que tenemos todos los datos necesarios
      if (!tokenData.address || !tokenData.name || !tokenData.symbol || 
          tokenData.decimals === undefined || !tokenData.totalSupply) {
        throw new Error(`Datos incompletos para el token ${address}`);
      }

      const updatedToken: TokenBase = {
        address: tokenData.address,
        name: tokenData.name,
        symbol: tokenData.symbol,
        decimals: tokenData.decimals,
        totalSupply: tokenData.totalSupply,
        network: this.chainName,
        createdAt: new Date(),
        analysis,
        score
      };

      this.saveToken(updatedToken);
    } catch (error) {
      console.error(`Error actualizando análisis del token ${address}:`, error);
    }
  }

  /**
   * Carga y actualiza los tokens guardados
   */
  public async loadAndUpdateTokens(autoAnalyze = false) {
    try {
      // Cargar tokens guardados
      const savedTokens = await this.loadSavedTokens();
      this.tokens = savedTokens;

      if (autoAnalyze) {
        // Solo analizar si se solicita explícitamente
        for (const token of savedTokens) {
          await this.queueTokenAnalysis(token.address);
        }
      }

      return savedTokens;
    } catch (error) {
      console.error('Error en loadAndUpdateTokens:', error);
      throw error;
    }
  }

  private needsUpdate(token: TokenBase): boolean {
    const cacheKey = `analysis_${token.address.toLowerCase()}`;
    const cachedAnalysis = localStorage.getItem(cacheKey);
    
    if (!cachedAnalysis) return true;
    
    try {
      const parsed = JSON.parse(cachedAnalysis);
      const cacheAge = Date.now() - parsed.timestamp;
      // Actualizar si el caché tiene más de 5 minutos
      return cacheAge > 5 * 60 * 1000;
    } catch {
      return true;
    }
  }

  async processNewPairs(logs: BSCScanEvent[], source: 'websocket' | 'polling' = 'polling') {
    for (const log of logs) {
      try {
        const token0 = '0x' + log.topics[1].slice(26).toLowerCase();
        const token1 = '0x' + log.topics[2].slice(26).toLowerCase();
        const pairAddress = '0x' + log.data.slice(26).toLowerCase();

        // Ignorar si alguna dirección es inválida
        if (!token0 || !token1 || !pairAddress) {
          console.warn('Direcciones inválidas en el evento:', { token0, token1, pairAddress });
          continue;
        }

        // Verificar si ya hemos procesado este par
        if (this.processedTransactions.has(pairAddress)) {
          continue;
        }

        // Marcar como procesado
        this.processedTransactions.add(pairAddress);

        // Identificar el token (el que no es WBNB)
        const tokenAddress = token0.toLowerCase() === ADDRESSES.WBNB.toLowerCase() ? token1 : token0;

        // Verificar si el token es tradeable antes de continuar
        const isTradeable = await this.isTokenTradeable(tokenAddress);
        if (!isTradeable) {
          console.log(`[${this.formatTime(new Date())}] Token ${tokenAddress} no es tradeable, ignorando`);
          continue;
        }

        console.log(`[${this.formatTime(new Date())}] Nuevo par detectado (${source}):`, {
          token0,
          token1,
          pairAddress,
          tokenAddress
        });

        // Obtener datos básicos del token
        const tokenData = await this.getTokenData(tokenAddress);
        if (!tokenData.address || !tokenData.name || !tokenData.symbol || 
            tokenData.decimals === undefined || !tokenData.totalSupply) {
          console.warn(`Token incompleto, ignorando:`, tokenData);
          continue;
        }

        // Analizar el token
        const analysis = await this.analyzeToken(tokenAddress);
        const score = this.calculateScore(analysis);

        const token: TokenBase = {
          address: tokenData.address,
          name: tokenData.name,
          symbol: tokenData.symbol,
          decimals: tokenData.decimals,
          totalSupply: tokenData.totalSupply,
          network: this.chainName,
          createdAt: new Date(),
          analysis,
          score
        };

        // Guardar el token
        await this.saveToken(token);

        // Emitir evento de nuevo token
        const newTokenEvent = new CustomEvent('newToken', {
          detail: { token }
        });
        window.dispatchEvent(newTokenEvent);

      } catch (error) {
        console.error('Error procesando nuevo par:', error);
      }
    }
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    });
  }

  // Métodos públicos para acceso desde hooks
  public async getSavedTokens(): Promise<TokenBase[]> {
    return this.loadSavedTokens();
  }

  public async updateTokenData(address: string, analysis: TokenAnalysis, score: TokenScore): Promise<void> {
    return this.updateTokenAnalysis(address, analysis, score);
  }

  public async fetchTokenData(address: string): Promise<Partial<TokenBase>> {
    return this.getTokenData(address);
  }
}
