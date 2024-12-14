interface TokenCardProps {
  name: string;
  score: number;
  liquidity: number;
  holders: number;
}

export function TokenCard({
  name,
  score,
  liquidity,
  holders,
}: TokenCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl bg-white/95 dark:bg-gray-900/80 backdrop-blur-[2px] shadow-md border border-gray-200 dark:border-gray-800 p-6 transition-all duration-300 hover:bg-white hover:shadow-lg dark:hover:bg-gray-900">
      <div className="relative">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{name}</h2>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Score</span>
            <span className="font-medium bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 text-transparent bg-clip-text">
              {score}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Liquidity</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">${liquidity}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Holders</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{holders}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
