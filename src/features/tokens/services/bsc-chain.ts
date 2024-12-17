import { BaseChainService } from './base-chain'
import { TokenBase, TokenAnalysis, TokenScore } from '../types/token'
import { createPublicClient, http, parseAbi } from 'viem'
import { bsc } from 'viem/chains'
import axios, { AxiosError } from 'axios'
import { BSC_RPC_URLS, getRandomRPC } from '@/config/rpc'
import { WebSocketService } from './websocket-service'
import { ethers } from 'ethers';

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

export class BSCChainService extends BaseChainService {
  private static instance: BSCChainService | null = null;
  readonly chainId = '56'
  readonly chainName = 'BSC'
  readonly scanApiUrl = 'https://api.bscscan.com/api'
  readonly scanApiKey = process.env.NEXT_PUBLIC_BSCSCAN_API_KEY || ''
  private wsService: WebSocketService;
  private processedTransactions = new Set<string>();
  private client: ReturnType<typeof createPublicClient> | null = null;
  private readonly STORAGE_KEY = 'bsc_tokens';
  private provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_BSC_RPC_URL);
  private analysisQueue: string[] = [];
  private isProcessingQueue = false;
  private readonly CONCURRENT_REQUESTS = 3;
  private readonly DELAY_BETWEEN_REQUESTS = 1000; // 1 segundo
  private tokens: TokenBase[] = [];

  private constructor() {
    super();
    this.processedTransactions = new Set();
    this.chainName = 'BSC';
    this.STORAGE_KEY = 'bsc_tokens';
    this.provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_BSC_RPC_URL);
    
    // Cargar tokens guardados de forma asíncrona
    this.loadAndUpdateTokens().catch(error => {
      console.error(`[${this.formatTime(new Date())}] Error en la carga inicial de tokens:`, error);
    });
    
    // Escuchar eventos del WebSocket
    window.addEventListener('newPairEvent', ((event: CustomEvent) => {
      const logData = event.detail.data;
      if (logData && logData.token0 && logData.token1) {
        this.processNewPairs([logData], 'websocket');
      }
    }) as EventListener);

    this.wsService = WebSocketService.getInstance();
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
        console.warn(`[${this.formatTime(new Date())}] Tokens guardados no es un array, reseteando`);
        savedTokens = [];
      }
    } catch (e) {
      console.warn(`[${this.formatTime(new Date())}] Error parseando tokens guardados, reseteando:`, e);
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
      console.log(`[${this.formatTime(new Date())}] Token ${existingTokenIndex === -1 ? 'guardado' : 'actualizado'}:`, token.address);

      // Emitir evento para actualizar la UI
      const loadedTokensEvent = new CustomEvent('tokensLoaded', {
        detail: { tokens }
      });
      window.dispatchEvent(loadedTokensEvent);
    } catch (error) {
      console.error(`[${this.formatTime(new Date())}] Error guardando token:`, error);
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
      // Caché válido por 5 minutos
      if (cacheAge < 5 * 60 * 1000) {
        return parsed.data;
      }
    }

    try {
      const contract = this.getTokenContract(address);
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.totalSupply()
      ]);

      const tokenData = {
        address,
        name,
        symbol,
        decimals: Number(decimals),
        totalSupply: totalSupply.toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Guardar en caché
      localStorage.setItem(cacheKey, JSON.stringify({
        data: tokenData,
        timestamp: Date.now()
      }));

      return tokenData;
    } catch (error) {
      console.error(`[${this.formatTime(new Date())}] Error obteniendo datos del token ${address}:`, error);
      throw error;
    }
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
    const cacheKey = `analysis_${address}`;
    
    try {
      // Verificar caché primero
      const cachedAnalysis = localStorage.getItem(cacheKey);
      if (cachedAnalysis) {
        const parsed = JSON.parse(cachedAnalysis);
        const cacheAge = Date.now() - parsed.timestamp;
        
        if (cacheAge < 5 * 60 * 1000) {
          console.log(`[${this.formatTime(new Date())}] Usando análisis en caché válido para: ${address}`);
          return parsed.data;
        }
      }

      console.log(`[${this.formatTime(new Date())}] Realizando análisis completo para: ${address}`);
      
      // Realizar análisis completo
      const [holders, liquidityData, contractData, distributionData, socialData] = await Promise.all([
        this.getHolders(address),
        this.getLiquidityData(address),
        this.getContractData(address),
        this.getDistributionData(address),
        this.getSocialData(address)
      ]);

      const analysis: TokenAnalysis = {
        holders,
        liquidityUSD: liquidityData.liquidityUSD,
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
          verified: contractData.contract.verified,
          hasHoneypot: contractData.contract.hasHoneypot,
          hasUnlimitedMint: contractData.contract.hasUnlimitedMint,
          hasTradingPause: contractData.contract.hasTradingPause,
          maxTaxPercentage: contractData.contract.maxTaxPercentage,
          hasDangerousFunctions: contractData.contract.hasDangerousFunctions
        },
        distribution: {
          maxWalletPercentage: distributionData.distribution.maxWalletPercentage,
          teamWalletPercentage: distributionData.distribution.teamWalletPercentage,
          top10HoldersPercentage: distributionData.distribution.top10HoldersPercentage
        },
        social: {
          telegram: socialData?.telegram,
          twitter: socialData?.twitter,
          website: socialData?.website,
          followers: socialData?.followers || 0,
          engagement: socialData?.engagement || 0
        },
        liquidityLocked: false,
        liquidityLockDuration: undefined,
        liquidityLockPlatform: undefined
      };

      // Guardar en caché con timestamp
      localStorage.setItem(cacheKey, JSON.stringify({
        data: analysis,
        timestamp: Date.now()
      }));

      // Calcular y actualizar score
      const score = this.calculateScore(analysis);
      this.updateTokenAnalysis(address, analysis, score);

      return analysis;
    } catch (error) {
      console.error(`[${this.formatTime(new Date())}] Error analizando token ${address}:`, error);
      throw error;
    }
  }

  private async getHolders(address: string) {
    return this.retryWithBackoff(async () => {
      try {
        const response = await axios.get(`/api/bscscan/holders`, {
          params: {
            address
          }
        });

        if (response.data.status === '1' && response.data.result) {
          const totalSupplyResult = await this.getTokenContract(address).totalSupply();
          const decimals = await this.getTokenContract(address).decimals();
          
          return (response.data.result as { address: string; balance: string }[]).map(holder => {
            const balance = BigInt(holder.balance);
            const totalSupply = BigInt(totalSupplyResult);
            const percentage = Number((balance * BigInt(10000) / totalSupply)) / 100;
            
            return {
              address: holder.address,
              balance: holder.balance,
              percentage
            };
          });
        }
        
        return [];
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error('Error cargando datos de la API:', error.response ? error.response.data : error.message);
        } else {
          console.error('Error desconocido:', error);
        }
        return [];
      }
    }, 5);
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
            liquidityBNB: '0',
            liquidityUSD: 0
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
            liquidityBNB: '0',
            liquidityUSD: 0
          }
        }

        const liquidityBNB = reserves[1].toString()
        return {
          hasLiquidity: true,
          liquidityBNB,
          liquidityUSD: Number(liquidityBNB)
        }
      } catch (error) {
        console.error(`[${this.formatTime(new Date())}] Error obteniendo datos de liquidez:`, error)
        return {
          hasLiquidity: false,
          liquidityBNB: '0',
          liquidityUSD: 0
        }
      }
    })
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

  private async processAnalysisQueue() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    try {
      while (this.analysisQueue.length > 0) {
        const batch = this.analysisQueue.splice(0, this.CONCURRENT_REQUESTS);
        const promises = batch.map(async (address) => {
          try {
            const analysis = await this.analyzeToken(address);
            const score = this.calculateScore(analysis);
            await this.updateTokenAnalysis(address, analysis, score);
          } catch (error) {
            console.error(`[${this.formatTime(new Date())}] Error analizando token ${address}:`, error);
          }
          await this.delay(this.DELAY_BETWEEN_REQUESTS);
        });

        await Promise.all(promises);
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
      console.log(`[${this.formatTime(new Date())}] Token ${address} ya está en la cola de análisis`);
      return;
    }

    // Verificar si el token tiene un análisis reciente en caché
    const cacheKey = `analysis_${address}`;
    const cachedAnalysis = localStorage.getItem(cacheKey);
    if (cachedAnalysis) {
      try {
        const parsed = JSON.parse(cachedAnalysis);
        const cacheAge = Date.now() - parsed.timestamp;
        if (cacheAge < 5 * 60 * 1000) { // Caché válido por 5 minutos
          console.log(`[${this.formatTime(new Date())}] Usando análisis en caché para: ${address}`);
          return;
        }
      } catch {
        // Si hay error al parsear el caché, continuamos con el análisis
      }
    }

    console.log(`[${this.formatTime(new Date())}] Añadiendo token ${address} a la cola de análisis`);
    this.analysisQueue.push(address);
    
    // Iniciar el procesamiento si no está en curso
    if (!this.isProcessingQueue) {
      this.processAnalysisQueue();
    }
  }

  private async updateTokenAnalysis(address: string, analysis: TokenAnalysis, score: TokenScore) {
    try {
      const tokenData = await this.getTokenData(address);
      const updatedToken: TokenBase = {
        ...tokenData,
        analysis,
        score,
        updatedAt: new Date()
      } as TokenBase;
      this.saveToken(updatedToken);
    } catch (error) {
      console.error(`[${this.formatTime(new Date())}] Error actualizando análisis del token ${address}:`, error);
    }
  }

  private async loadAndUpdateTokens() {
    try {
      const savedTokens = await this.loadSavedTokens();
      console.log(`[${this.formatTime(new Date())}] ${savedTokens.length} tokens cargados del almacenamiento local`);
      
      // Asegurarnos de que los tokens se cargan en el estado
      this.tokens = savedTokens;
      
      // Encolar para análisis solo los tokens que no tienen análisis reciente
      const tokensToAnalyze = savedTokens.filter(token => this.needsUpdate(token));
      console.log(`[${this.formatTime(new Date())}] ${tokensToAnalyze.length} tokens requieren actualización`);
      
      tokensToAnalyze.forEach(token => {
        this.queueTokenAnalysis(token.address);
      });
    } catch (error) {
      console.error(`[${this.formatTime(new Date())}] Error cargando tokens:`, error);
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

  private async processNewPairs(logs: BSCScanEvent[], source: 'websocket' | 'polling' = 'polling') {
    try {
      const now = new Date();
      console.log(`[${this.formatTime(now)}][${source.toUpperCase()}] Procesando ${logs.length} eventos de nuevos pares`);
      
      // Extraer las direcciones de los tokens
      const addresses = logs.flatMap(event => {
        // Si ya procesamos esta transacción, ignorarla
        if (this.processedTransactions.has(event.transactionHash)) {
          console.log(`[${this.formatTime(now)}][${source.toUpperCase()}] Transacción ya procesada:`, event.transactionHash);
          return [];
        }

        // Usar token0 y token1 si están disponibles (desde WebSocket)
        if ('token0' in event && 'token1' in event && event.token0 && event.token1) {
          console.log(`[${this.formatTime(now)}][${source.toUpperCase()}] Par encontrado (WebSocket):`, {
            token0: event.token0,
            token1: event.token1,
            pairAddress: event.pairAddress,
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash
          });
          
          // Marcar como procesado DESPUÉS de obtener las direcciones
          this.processedTransactions.add(event.transactionHash);
          return [event.token0, event.token1];
        }
        
        // Fallback para eventos de polling
        if (!event.topics || event.topics.length < 3) {
          console.warn(`[${this.formatTime(now)}][${source.toUpperCase()}] Evento inválido, faltan topics:`, event);
          return [];
        }

        const token0 = '0x' + event.topics[1].slice(26);
        const token1 = '0x' + event.topics[2].slice(26);
        
        console.log(`[${this.formatTime(now)}][${source.toUpperCase()}] Par encontrado (Polling):`, {
          token0,
          token1,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        });

        // Marcar como procesado DESPUÉS de obtener las direcciones
        this.processedTransactions.add(event.transactionHash);
        return [token0, token1];
      }).filter(address => {
        const isWBNB = address.toLowerCase() === ADDRESSES.WBNB.toLowerCase();
        const isPancakeFactory = address.toLowerCase() === ADDRESSES.PANCAKE_FACTORY.toLowerCase();
        if (isWBNB || isPancakeFactory) {
          console.log(`[${this.formatTime(now)}][${source.toUpperCase()}] Ignorando dirección conocida:`, {
            address,
            isWBNB,
            isPancakeFactory
          });
          return false;
        }
        return true;
      });

      const uniqueAddresses = [...new Set(addresses)];
      console.log(`[${this.formatTime(now)}][${source.toUpperCase()}] Direcciones después de filtrar:`, uniqueAddresses);
      
      if (uniqueAddresses.length > 0) {
        console.log(`[${this.formatTime(now)}][${source.toUpperCase()}] Procesando ${uniqueAddresses.length} direcciones únicas:`, uniqueAddresses);
        
        // Procesar cada token único
        for (const address of uniqueAddresses) {
          try {
            console.log(`[${this.formatTime(now)}][${source.toUpperCase()}] Obteniendo datos del token: ${address}`);
            const tokenData = await this.getTokenData(address);
            console.log(`[${this.formatTime(now)}][${source.toUpperCase()}] Datos obtenidos para ${address}:`, tokenData);
            
            if (this.isValidToken(tokenData)) {
              console.log(`[${this.formatTime(now)}][${source.toUpperCase()}] Token válido encontrado:`, {
                address: tokenData.address,
                name: tokenData.name,
                symbol: tokenData.symbol,
                decimals: tokenData.decimals,
                totalSupply: tokenData.totalSupply
              });
              
              // Analizar el token antes de guardarlo
              this.queueTokenAnalysis(tokenData.address);
            } else {
              console.log(`[${this.formatTime(now)}][${source.toUpperCase()}] Token inválido:`, {
                address,
                tokenData
              });
            }
          } catch (error) {
            console.error(`[${this.formatTime(now)}][${source.toUpperCase()}] Error procesando token ${address}:`, error);
          }
        }
      } else {
        console.log(`[${this.formatTime(now)}][${source.toUpperCase()}] No hay direcciones únicas para procesar`);
      }
    } catch (error) {
      console.error(`[${this.formatTime(new Date())}][${source.toUpperCase()}] Error procesando eventos:`, error);
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
}
