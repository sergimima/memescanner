'use client'

import { TokenCard } from "@/components/ui/token-card"
import Link from "next/link"
import { useTokenDetection } from "@/features/tokens/hooks/useTokenDetection"
import { useNetwork } from '@/features/network/network-context'

export default function Home() {
  const { tokens, loading, error } = useTokenDetection({ autoRefresh: true }); // Activar análisis automático
  const { network } = useNetwork()

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 dark:from-purple-950 dark:via-gray-900 dark:to-blue-950">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-transparent dark:bg-gradient-to-r dark:from-white dark:to-gray-300 dark:bg-clip-text">
            MemeScanner
          </h1>
          <button
            onClick={() => refreshTokens()}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Buscando nuevos tokens...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <div className="max-w-md mx-auto bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
                Red no soportada
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {error.message}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Por favor, selecciona BSC en el selector de red para continuar.
              </p>
            </div>
          </div>
        )}

        {!loading && !error && tokens.length === 0 && (
          <div className="text-center py-8 text-gray-600">
            <p>No se encontraron tokens nuevos.</p>
          </div>
        )}

        {!loading && !error && tokens.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tokens.map((token) => (
              <Link 
                key={token.address} 
                href={`/token/${token.address}`} 
                className="transform transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
              >
                <TokenCard 
                  token={token}
                  onAnalyze={() => {}} // Podemos implementar esto después si es necesario
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
