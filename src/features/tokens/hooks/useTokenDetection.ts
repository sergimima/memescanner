'use client'

import { useState, useEffect, useMemo } from 'react'
import { TokenBase } from '../types/token'
import { BSCChainService } from '../services/bsc-chain'
import { useNetwork } from '@/features/network/network-context'

export function useTokenDetection() {
  const [tokens, setTokens] = useState<TokenBase[]>([])
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
      addToken(event.detail.token);
    };

    // Añadir el listener
    window.addEventListener('newTokenFound', handleNewToken as EventListener);

    // Limpiar el listener cuando el componente se desmonte
    return () => {
      window.removeEventListener('newTokenFound', handleNewToken as EventListener);
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
