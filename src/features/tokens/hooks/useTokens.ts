import { useState, useEffect } from 'react';
import { TokenBase, TokenAnalysis, TokenHolder, TokenScore } from '@/types/token';
import { BSCChainService } from '../services/bsc-chain';
import { useNetwork } from '@/features/network/network-context';

const defaultScore: TokenScore = {
  total: 0,
  security: 0,
  liquidity: 0,
  community: 0
};

const defaultToken: TokenBase = {
  address: '',
  name: '',
  symbol: '',
  decimals: 0,
  totalSupply: '0',
  network: 'bsc',
  createdAt: new Date(),
  score: defaultScore,
  analysis: {
    price: 0,
    liquidityUSD: 0,
    holders: [],
    buyCount: 0,
    sellCount: 0,
    marketCap: 0,
    lockedLiquidity: {
      percentage: 0,
      until: new Date().toISOString(),
      verified: false
    },
    liquidityLocked: true,
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
      topHolders: []
    },
    social: {
      telegram: '',
      twitter: '',
      website: ''
    },
    canTrade: true
  }
};

export function useTokens(options: { autoRefresh?: boolean } = { autoRefresh: false }) {
  const [tokens, setTokens] = useState<TokenBase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { network } = useNetwork();
  const [lastRefresh, setLastRefresh] = useState<Record<string, number>>({});

  const chainService = network === 'bsc' ? BSCChainService.getInstance() : null;

  useEffect(() => {
    const loadSavedTokens = () => {
      try {
        const savedTokensJson = localStorage.getItem('bsc_tokens');
        if (savedTokensJson) {
          const savedTokens: TokenBase[] = JSON.parse(savedTokensJson);
          setTokens(savedTokens);
        }
      } catch (error) {
        console.error('Error cargando tokens guardados:', error);
        setError(error as Error);
      }
    };

    loadSavedTokens();

    // Configurar event listeners
    window.addEventListener('newTokenFound', handleNewToken as EventListener);
    window.addEventListener('tokensLoaded', handleTokensLoaded as EventListener);

    return () => {
      window.removeEventListener('newTokenFound', handleNewToken as EventListener);
      window.removeEventListener('tokensLoaded', handleTokensLoaded as EventListener);
    };
  }, [network]);

  const handleNewToken = (event: CustomEvent<{ token: TokenBase }>) => {
    setTokens(prevTokens => {
      const newToken = event.detail.token;
      // Verificar si el token ya existe
      const existingTokenIndex = prevTokens.findIndex(t => 
        t.address.toLowerCase() === newToken.address.toLowerCase()
      );
      
      if (existingTokenIndex !== -1) {
        // Si existe y hay cambios, actualizar
        const existingToken = prevTokens[existingTokenIndex];
        const hasChanges = JSON.stringify(existingToken) !== JSON.stringify(newToken);
        
        if (!hasChanges) {
          return prevTokens;
        }

        const updatedTokens = [...prevTokens];
        updatedTokens[existingTokenIndex] = { 
          ...existingToken, 
          ...newToken, 
          updatedAt: new Date() 
        };
        
        // Guardar en localStorage
        try {
          localStorage.setItem('bsc_tokens', JSON.stringify(updatedTokens));
        } catch (error) {
          console.error('Error guardando tokens:', error);
        }
        
        return updatedTokens;
      }
      
      // Si no existe, añadirlo al principio
      const newTokens = [{ ...newToken, createdAt: new Date(), updatedAt: new Date() }, ...prevTokens];
      
      // Guardar en localStorage
      try {
        localStorage.setItem('bsc_tokens', JSON.stringify(newTokens));
      } catch (error) {
        console.error('Error guardando tokens:', error);
      }
      
      return newTokens;
    });
  };

  const handleTokensLoaded = (event: CustomEvent<{ tokens: TokenBase[] }>) => {
    const newTokens = event.detail.tokens;
    setTokens(prevTokens => {
      // Combinar tokens existentes con nuevos, evitando duplicados
      const tokenMap = new Map(prevTokens.map(token => [token.address.toLowerCase(), token]));
      
      newTokens.forEach(token => {
        const existingToken = tokenMap.get(token.address.toLowerCase());
        if (!existingToken) {
          tokenMap.set(token.address.toLowerCase(), { 
            ...token, 
            createdAt: new Date(),
            updatedAt: new Date()
          });
        } else {
          // Actualizar solo si hay cambios
          const hasChanges = JSON.stringify(existingToken) !== JSON.stringify(token);
          if (hasChanges) {
            tokenMap.set(token.address.toLowerCase(), { 
              ...existingToken,
              ...token,
              updatedAt: new Date()
            });
          }
        }
      });

      const updatedTokens = Array.from(tokenMap.values());
      
      // Guardar en localStorage
      try {
        localStorage.setItem('bsc_tokens', JSON.stringify(updatedTokens));
      } catch (error) {
        console.error('Error guardando tokens:', error);
      }
      
      return updatedTokens;
    });
  };

  const refreshTokens = async () => {
    if (!chainService) {
      setError(new Error(`La red ${network} no está soportada todavía`));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Solo cargar tokens guardados, sin análisis automático
      const savedTokens = await chainService.getSavedTokens();
      const updatedTokens = savedTokens.map(token => {
        const now = new Date();
        const baseAnalysis: TokenAnalysis = token.analysis ? {
          ...defaultToken.analysis,
          ...token.analysis,
          price: typeof token.analysis.price === 'string' ? parseFloat(token.analysis.price) : token.analysis.price,
          lockedLiquidity: {
            ...token.analysis.lockedLiquidity,
            until: token.analysis.lockedLiquidity.until instanceof Date 
              ? token.analysis.lockedLiquidity.until.toISOString() 
              : token.analysis.lockedLiquidity.until
          },
          distribution: {
            maxWalletPercentage: token.analysis.distribution?.maxWalletPercentage || 0,
            topHolders: (token.analysis.holders || []).map((holder: Partial<TokenHolder>) => ({
              address: holder.address || '',
              balance: holder.balance || '0',
              percentage: holder.percentage || 0
            }))
          },
          social: {
            telegram: token.analysis.social?.telegram || '',
            twitter: token.analysis.social?.twitter || '',
            website: token.analysis.social?.website || ''
          }
        } : defaultToken.analysis;

        return {
          ...defaultToken,
          ...token,
          network: token.network || 'bsc',
          createdAt: token.createdAt || now,
          score: token.score || defaultScore,
          analysis: baseAnalysis
        };
      });
      setTokens(updatedTokens);
    } catch (error) {
      console.error('Error actualizando tokens:', error);
      setError(error as Error);
    } finally {
      setLoading(false);
    }
  };

  const updateToken = async (address: string) => {
    // Verificar si el token fue actualizado recientemente (en los últimos 5 minutos)
    const now = Date.now();
    const lastUpdate = lastRefresh[address] || 0;
    const REFRESH_COOLDOWN = 5 * 60 * 1000; // 5 minutos

    if (now - lastUpdate < REFRESH_COOLDOWN) {
      console.log(`Token ${address} fue actualizado recientemente. Esperando ${Math.ceil((REFRESH_COOLDOWN - (now - lastUpdate)) / 1000)} segundos.`);
      return;
    }

    setLoading(true);
    try {
      const service = BSCChainService.getInstance();
      const analysis = await service.analyzeToken(address);
      const score = service.calculateScore(analysis);
      await service.updateTokenData(address, analysis, score);
      
      // Actualizar el timestamp del último refresco
      const now = Date.now();
      setLastRefresh(prev => ({
        ...prev,
        [address]: now
      }));

      // Obtener datos actualizados del token y actualizar el estado
      const tokenData = await service.fetchTokenData(address);
      const currentDate = new Date();
      
      const updatedToken: TokenBase = {
        ...defaultToken,
        ...tokenData,
        network: 'bsc',
        createdAt: tokenData.createdAt || currentDate,
        updatedAt: currentDate,
        score: tokenData.score || defaultScore,
        analysis: {
          ...defaultToken.analysis,
          ...analysis,
          price: typeof analysis.price === 'string' ? parseFloat(analysis.price) : analysis.price,
          canTrade: true,
          lockedLiquidity: {
            ...analysis.lockedLiquidity,
            until: analysis.lockedLiquidity.until instanceof Date 
              ? analysis.lockedLiquidity.until.toISOString() 
              : analysis.lockedLiquidity.until
          },
          liquidityLocked: analysis.liquidityLocked || true,
          distribution: {
            maxWalletPercentage: analysis.distribution?.maxWalletPercentage || 0,
            topHolders: (analysis.holders || []).map((holder: Partial<TokenHolder>) => ({
              address: holder.address || '',
              balance: holder.balance || '0',
              percentage: holder.percentage || 0
            }))
          },
          social: {
            telegram: analysis.social?.telegram || '',
            twitter: analysis.social?.twitter || '',
            website: analysis.social?.website || ''
          }
        }
      };

      // Emitir evento de actualización
      const updateEvent = new CustomEvent('tokenUpdated', {
        detail: { token: updatedToken }
      });
      window.dispatchEvent(updateEvent);

      // Actualizar el estado local
      setTokens(prevTokens => 
        prevTokens.map(token => 
          token.address.toLowerCase() === address.toLowerCase() 
            ? updatedToken
            : token
        )
      );

      // Actualizar localStorage
      try {
        const savedTokensJson = localStorage.getItem('bsc_tokens');
        if (savedTokensJson) {
          const savedTokens = JSON.parse(savedTokensJson);
          const updatedTokens = savedTokens.map((token: TokenBase) =>
            token.address.toLowerCase() === address.toLowerCase()
              ? updatedToken
              : token
          );
          localStorage.setItem('bsc_tokens', JSON.stringify(updatedTokens));
        }
      } catch (error) {
        console.error('Error actualizando localStorage:', error);
      }

      return updatedToken;
    } catch (error) {
      setError(error as Error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Solo cargar tokens guardados al montar el componente
  useEffect(() => {
    if (options.autoRefresh) {
      refreshTokens();
    }
  }, [options.autoRefresh]);

  return { 
    tokens, 
    loading, 
    error,
    refreshTokens,
    updateToken
  };
}
