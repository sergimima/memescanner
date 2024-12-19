import React from 'react';
import { useWatchlist } from '../hooks/useWatchlist';

interface WatchlistButtonProps {
  tokenAddress: string;
  className?: string;
}

export function WatchlistButton({ tokenAddress, className = '' }: WatchlistButtonProps) {
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const isWatched = isInWatchlist(tokenAddress);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que el click se propague si el botón está dentro de un elemento clickeable
    e.preventDefault(); // Evitar que el link se active
    
    try {
      if (isWatched) {
        await removeFromWatchlist(tokenAddress);
      } else {
        await addToWatchlist(tokenAddress);
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center justify-center p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${className}`}
      title={isWatched ? 'Quitar de watchlist' : 'Añadir a watchlist'}
    >
      <span className="text-xl">
        {isWatched ? '⭐' : '☆'}
      </span>
    </button>
  );
}
