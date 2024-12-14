'use client'

import { useState } from 'react'
import { TokenAnalysis } from '../types/token'
import { BSCChainService } from '../services/bsc-chain'

export function useTokenAnalysis() {
  const [analysisResults, setAnalysisResults] = useState<Record<string, TokenAnalysis>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, Error | null | undefined>>({})

  const bscService = new BSCChainService()

  const analyzeToken = async (address: string) => {
    if (loading[address]) return

    try {
      setLoading(prev => ({ ...prev, [address]: true }))
      setErrors(prev => ({ ...prev, [address]: null }))

      const analysis = await bscService.analyzeToken(address)
      
      setAnalysisResults(prev => ({
        ...prev,
        [address]: analysis
      }))
    } catch (err) {
      setErrors(prev => ({
        ...prev,
        [address]: err as Error
      }))
      console.error(`Error analyzing token ${address}:`, err)
    } finally {
      setLoading(prev => ({ ...prev, [address]: false }))
    }
  }

  return {
    analysisResults,
    loading,
    errors,
    analyzeToken
  }
}
