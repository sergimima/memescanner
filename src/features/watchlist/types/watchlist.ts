export interface WatchlistItem {
  tokenAddress: string;
  userAddress: string;
  addedAt: string;
  notes?: string;
  priceAlert?: {
    above?: number;
    below?: number;
  };
}

export interface Watchlist {
  userAddress: string;
  items: WatchlistItem[];
  lastUpdated: string;
}
