import { Watchlist, WatchlistItem } from '../types/watchlist';

export class WatchlistService {
  private static instance: WatchlistService | null = null;
  private readonly STORAGE_KEY = 'watchlist';

  private constructor() {}

  static getInstance(): WatchlistService {
    if (!WatchlistService.instance) {
      WatchlistService.instance = new WatchlistService();
    }
    return WatchlistService.instance;
  }

  private getStorageKey(userAddress: string): string {
    return `${this.STORAGE_KEY}_${userAddress.toLowerCase()}`;
  }

  async getWatchlist(userAddress: string): Promise<Watchlist> {
    try {
      const storageKey = this.getStorageKey(userAddress);
      const savedWatchlist = localStorage.getItem(storageKey);
      
      if (savedWatchlist) {
        return JSON.parse(savedWatchlist);
      }

      // Si no existe, crear uno nuevo
      const newWatchlist: Watchlist = {
        userAddress: userAddress.toLowerCase(),
        items: [],
        lastUpdated: new Date().toISOString()
      };

      await this.saveWatchlist(newWatchlist);
      return newWatchlist;
    } catch (error) {
      console.error('Error cargando watchlist:', error);
      throw error;
    }
  }

  async addToWatchlist(userAddress: string, tokenAddress: string, notes?: string): Promise<void> {
    try {
      const watchlist = await this.getWatchlist(userAddress);
      
      // Verificar si el token ya está en la lista
      const exists = watchlist.items.some(
        item => item.tokenAddress.toLowerCase() === tokenAddress.toLowerCase()
      );

      if (!exists) {
        const newItem: WatchlistItem = {
          tokenAddress: tokenAddress.toLowerCase(),
          userAddress: userAddress.toLowerCase(),
          addedAt: new Date().toISOString(),
          notes
        };

        watchlist.items.push(newItem);
        watchlist.lastUpdated = new Date().toISOString();
        
        await this.saveWatchlist(watchlist);
        
        // Disparar evento para actualizar la UI
        const event = new CustomEvent('watchlistUpdated', {
          detail: { watchlist }
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error('Error añadiendo token al watchlist:', error);
      throw error;
    }
  }

  async removeFromWatchlist(userAddress: string, tokenAddress: string): Promise<void> {
    try {
      const watchlist = await this.getWatchlist(userAddress);
      
      watchlist.items = watchlist.items.filter(
        item => item.tokenAddress.toLowerCase() !== tokenAddress.toLowerCase()
      );
      
      watchlist.lastUpdated = new Date().toISOString();
      await this.saveWatchlist(watchlist);
      
      // Disparar evento para actualizar la UI
      const event = new CustomEvent('watchlistUpdated', {
        detail: { watchlist }
      });
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Error eliminando token del watchlist:', error);
      throw error;
    }
  }

  async updatePriceAlert(
    userAddress: string, 
    tokenAddress: string, 
    alerts: { above?: number; below?: number }
  ): Promise<void> {
    try {
      const watchlist = await this.getWatchlist(userAddress);
      const item = watchlist.items.find(
        item => item.tokenAddress.toLowerCase() === tokenAddress.toLowerCase()
      );

      if (item) {
        item.priceAlert = alerts;
        watchlist.lastUpdated = new Date().toISOString();
        await this.saveWatchlist(watchlist);
        
        // Disparar evento para actualizar la UI
        const event = new CustomEvent('watchlistUpdated', {
          detail: { watchlist }
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error('Error actualizando alerta de precio:', error);
      throw error;
    }
  }

  private async saveWatchlist(watchlist: Watchlist): Promise<void> {
    try {
      const storageKey = this.getStorageKey(watchlist.userAddress);
      localStorage.setItem(storageKey, JSON.stringify(watchlist));
    } catch (error) {
      console.error('Error guardando watchlist:', error);
      throw error;
    }
  }
}
