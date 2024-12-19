import { useState, useEffect } from 'react';
import { Watchlist, WatchlistItem } from '../types/watchlist';
import { WatchlistService } from '../services/watchlist-service';
import { useAccount } from 'wagmi';

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<Watchlist | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { address } = useAccount();

  const watchlistService = WatchlistService.getInstance();

  useEffect(() => {
    const loadWatchlist = async () => {
      if (!address) return;

      try {
        setLoading(true);
        const userWatchlist = await watchlistService.getWatchlist(address);
        setWatchlist(userWatchlist);
      } catch (err) {
        console.error('Error cargando watchlist:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    loadWatchlist();

    // Escuchar eventos de actualización
    const handleWatchlistUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ watchlist: Watchlist }>;
      if (customEvent.detail.watchlist.userAddress.toLowerCase() === address?.toLowerCase()) {
        setWatchlist(customEvent.detail.watchlist);
      }
    };

    window.addEventListener('watchlistUpdated', handleWatchlistUpdate as EventListener);

    return () => {
      window.removeEventListener('watchlistUpdated', handleWatchlistUpdate as EventListener);
    };
  }, [address]);

  const addToWatchlist = async (tokenAddress: string, notes?: string) => {
    if (!address) return;
    
    try {
      await watchlistService.addToWatchlist(address, tokenAddress, notes);
    } catch (err) {
      console.error('Error añadiendo token al watchlist:', err);
      throw err;
    }
  };

  const removeFromWatchlist = async (tokenAddress: string) => {
    if (!address) return;
    
    try {
      await watchlistService.removeFromWatchlist(address, tokenAddress);
    } catch (err) {
      console.error('Error eliminando token del watchlist:', err);
      throw err;
    }
  };

  const updatePriceAlert = async (
    tokenAddress: string, 
    alerts: { above?: number; below?: number }
  ) => {
    if (!address) return;
    
    try {
      await watchlistService.updatePriceAlert(address, tokenAddress, alerts);
    } catch (err) {
      console.error('Error actualizando alerta de precio:', err);
      throw err;
    }
  };

  const isInWatchlist = (tokenAddress: string): boolean => {
    if (!watchlist) return false;
    return watchlist.items.some(
      item => item.tokenAddress.toLowerCase() === tokenAddress.toLowerCase()
    );
  };

  return {
    watchlist,
    loading,
    error,
    addToWatchlist,
    removeFromWatchlist,
    updatePriceAlert,
    isInWatchlist
  };
}
