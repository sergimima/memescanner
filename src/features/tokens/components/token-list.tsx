'use client'

import { useTokenDetection } from "../hooks/useTokenDetection"
import { useTokenAnalysis } from "../hooks/useTokenAnalysis"
import { TokenCard } from "./token-card"

export function TokenList() {
  const { tokens, loading: tokensLoading, error: tokensError, refreshTokens } = useTokenDetection()
  const { analyzeToken, loading: analysisLoading } = useTokenAnalysis()

  if (tokensError) {
    return (
      <div className="text-center text-red-500">
        Error cargando tokens: {tokensError.message}
      </div>
    )
  }

  if (tokensLoading && tokens.length === 0) {
    return <div className="text-center">Cargando tokens...</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {tokens.map(token => (
        <TokenCard
          key={token.address}
          token={token}
          onAnalyze={() => analyzeToken(token.address)}
        />
      ))}
      {tokens.length === 0 && !tokensLoading && (
        <div className="text-center col-span-full">
          No se encontraron tokens nuevos
        </div>
      )}
    </div>
  )
}
