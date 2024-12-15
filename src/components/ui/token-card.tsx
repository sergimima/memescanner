import { TokenBase } from "@/features/tokens/types/token"

interface TokenCardProps {
  token: TokenBase;
  onAnalyze?: () => void;
}

export function TokenCard({
  token,
  onAnalyze
}: TokenCardProps) {
  const { name, symbol, score, analysis } = token
  const liquidity = analysis?.liquidityUSD || 0
  const holders = analysis?.holders || 0
  const totalScore = score?.total || 0

  return (
    <div className="group relative overflow-hidden rounded-xl bg-white/95 dark:bg-gray-900/80 backdrop-blur-[2px] shadow-md border border-gray-200 dark:border-gray-800 p-6 transition-all duration-300 hover:bg-white hover:shadow-lg dark:hover:bg-gray-900">
      <div className="relative">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{symbol}</p>
          </div>
          {onAnalyze && (
            <button 
              onClick={(e) => {
                e.preventDefault()
                onAnalyze()
              }}
              className="text-sm px-3 py-1 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900"
            >
              Analizar
            </button>
          )}
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Score</span>
            <span className="font-semibold text-gray-900 dark:text-white">{totalScore}/100</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Liquidez</span>
            <span className="font-semibold text-gray-900 dark:text-white">${liquidity.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Holders</span>
            <span className="font-semibold text-gray-900 dark:text-white">{holders.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
