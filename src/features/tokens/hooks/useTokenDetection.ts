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
      return new BSCChainService()
    }
    return null
  }, [network])

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
        const addresses = new Set(prevTokens.map(t => t.address))
        const uniqueNewTokens = newTokens.filter(t => !addresses.has(t.address))
        return [...prevTokens, ...uniqueNewTokens]
      })
    } catch (err) {
      setError(err as Error)
      console.error('Error detecting new tokens:', err)
    } finally {
      setLoading(false)
    }
  }

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
