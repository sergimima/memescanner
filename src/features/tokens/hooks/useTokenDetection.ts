'use client'

import { useState, useEffect, useMemo } from 'react'
import { TokenBase } from '../types/token'
import { BSCChainService } from '../services/bsc-chain'
import { useNetwork } from '@/features/network/network-context'

export function useTokenDetection() {
  const [tokens, setTokens] = useState<TokenBase[]>(() => {
    // Cargar tokens guardados al inicializar el estado
    try {
      const savedTokensJson = localStorage.getItem('memetracker_tokens');
      if (savedTokensJson) {
        const savedTokens = JSON.parse(savedTokensJson);
        console.log(`[${new Date().toLocaleTimeString()}] Cargando ${savedTokens.length} tokens guardados en el estado inicial`);
        return savedTokens;
      }
    } catch (error) {
      console.error(`[${new Date().toLocaleTimeString()}] Error cargando tokens guardados en el estado inicial:`, error);
    }
    return [];
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { network } = useNetwork()

  const chainService = useMemo(() => {
    if (network === 'bsc') {
      return BSCChainService.getInstance()
    }
    return null
  }, [network])

  const addToken = (token: TokenBase) => {
    setTokens(prevTokens => {
      // Verificar si el token ya existe
      if (prevTokens.some(t => t.address.toLowerCase() === token.address.toLowerCase())) {
        return prevTokens;
      }
      // Añadir el nuevo token al principio del array
      return [token, ...prevTokens];
    });
  };

  const detectNewTokens = async () => {
    try {
      if (!chainService) {
        setError(new Error(`La red ${network} no está soportada todavía`))
        setTokens([])
        return
      }

      setLoading(true)
      setError(null)
      const newTokens = await chainService.getNewTokens()
      setTokens(prevTokens => {
        // Filtrar tokens duplicados por dirección
        const addresses = new Set(prevTokens.map(t => t.address.toLowerCase()))
        const uniqueNewTokens = newTokens.filter(t => !addresses.has(t.address.toLowerCase()))
        return [...uniqueNewTokens, ...prevTokens]
      })
    } catch (err) {
      setError(err as Error)
      console.error('Error detecting new tokens:', err)
    } finally {
      setLoading(false)
    }
  }

  // Escuchar eventos de nuevos tokens
  useEffect(() => {
    const handleNewToken = (event: CustomEvent<{ token: TokenBase }>) => {
      console.log('[useTokenDetection] Nuevo token detectado:', event.detail.token);
      setTokens(prevTokens => [event.detail.token, ...prevTokens]);
    };

    const handleTokensLoaded = (event: CustomEvent<{ tokens: TokenBase[] }>) => {
      setTokens(event.detail.tokens);
    };

    // Escuchar eventos
    window.addEventListener('newTokenFound', handleNewToken as EventListener);
    window.addEventListener('tokensLoaded', handleTokensLoaded as EventListener);

    return () => {
      window.removeEventListener('newTokenFound', handleNewToken as EventListener);
      window.removeEventListener('tokensLoaded', handleTokensLoaded as EventListener);
    };
  }, []);

  // Detectar tokens iniciales y configurar polling
  useEffect(() => {
    detectNewTokens()
    // Configurar un intervalo para detectar nuevos tokens cada 2 minutos
    const interval = setInterval(detectNewTokens, 120000)
    return () => clearInterval(interval)
  }, [chainService])

  return {
    tokens,
    loading,
    error,
    refreshTokens: detectNewTokens
  }
}
