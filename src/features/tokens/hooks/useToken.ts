'use client'

import { useState, useEffect } from 'react'
import { BSCChainService } from '../services/bsc-chain'
import { TokenBase, TokenAnalysis } from '../types/token'
import { useNetwork } from '@/features/network/network-context'

interface TokenData {
  token: TokenBase | null
  analysis: TokenAnalysis | null
  loading: boolean
  error: Error | null
}

export function useToken(address: string): TokenData {
  const [data, setData] = useState<TokenData>({
    token: null,
    analysis: null,
    loading: true,
    error: null
  })
  const { network } = useNetwork()

  useEffect(() => {
    const fetchToken = async () => {
      if (!address) return

      try {
        setData(prev => ({ ...prev, loading: true, error: null }))
        
        const chainService = BSCChainService.getInstance()
        const tokenContract = chainService.getTokenContract(address)
        const [name, symbol, decimals, totalSupply] = await Promise.all([
          tokenContract.name() as Promise<string>,
          tokenContract.symbol() as Promise<string>,
          tokenContract.decimals() as Promise<number>,
          tokenContract.totalSupply() as Promise<bigint>
        ])

        const analysis = await chainService.analyzeToken(address)
        const score = chainService.calculateScore(analysis)

        const tokenBase: TokenBase = {
          address,
          name,
          symbol,
          decimals,
          totalSupply: totalSupply.toString(),
          network: 'bsc',
          createdAt: new Date(),
          score,
          analysis
        }

        setData({
          token: tokenBase,
          analysis,
          loading: false,
          error: null
        })
      } catch (err) {
        console.error('Error fetching token:', err)
        setData(prev => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err : new Error('Error desconocido al obtener el token')
        }))
      }
    }

    fetchToken()
  }, [address, network])

  return data
}
