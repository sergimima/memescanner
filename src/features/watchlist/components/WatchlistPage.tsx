import React, { useState } from 'react';
import { useWatchlist } from '../hooks/useWatchlist';
import { TokenInfoTab } from "@/components/token/token-info-tab";
import { WatchlistAlertModal } from './WatchlistAlertModal';
import { useTokens } from '@/features/tokens/hooks/useTokens';
import Link from 'next/link';
import { formatUSD } from '@/utils/format';

export function WatchlistPage() {
  const { watchlist } = useWatchlist();
  const { tokens } = useTokens();
  const [selectedToken, setSelectedToken] = useState<string | null>(null);

  if (!watchlist || !tokens) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 dark:from-purple-950 dark:via-gray-900 dark:to-blue-950">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </main>
    );
  }

  const watchlistTokens = watchlist.items
    .map(item => tokens.find(t => t.address === item.tokenAddress))
    .filter(token => token !== undefined);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 dark:from-purple-950 dark:via-gray-900 dark:to-blue-950">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Mi Watchlist</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {watchlistTokens.map(token => token && (
            <Link 
              key={token.address} 
              href={`/token/${token.address}`}
              className="block bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{token.name}</h3>
                  <p className="text-sm text-gray-500">{token.symbol}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedToken(token.address);
                  }}
                  className="text-blue-500 hover:text-blue-600"
                >
                  ⚙️
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Precio:</span>
                  <span className="font-medium">${formatUSD(token.analysis?.price ? Number(token.analysis.price) : 0)}</span>
                </div>
                {token.analysis?.liquidityUSD && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Liquidez:</span>
                    <span className="font-medium">${formatUSD(token.analysis.liquidityUSD)}</span>
                  </div>
                )}
              </div>

              {watchlist.items.find(item => item.tokenAddress === token.address)?.priceAlert && (
                <div className="mt-4 p-2 bg-blue-50 dark:bg-blue-900 rounded-lg">
                  <p className="text-sm text-blue-600 dark:text-blue-200">
                    🔔 Alerta de precio configurada
                  </p>
                </div>
              )}
            </Link>
          ))}
        </div>

        {selectedToken && (
          <WatchlistAlertModal
            tokenAddress={selectedToken}
            onClose={() => setSelectedToken(null)}
          />
        )}

        {watchlistTokens.length === 0 && (
          <div className="text-center py-16">
            <p className="text-xl text-gray-500">No hay tokens en tu watchlist</p>
            <p className="mt-2 text-gray-400">Añade tokens usando el botón de estrella ⭐</p>
          </div>
        )}
      </div>
    </main>
  );
}
