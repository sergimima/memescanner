import { useState, useEffect } from 'react';
import { TokenBase } from '@/types/token';
import { BSCChainService } from '../services/bsc-chain';

export function useTokens() {
  const [tokens, setTokens] = useState<TokenBase[]>([]);

  useEffect(() => {
    const savedTokensJson = localStorage.getItem('bsc_tokens');
    if (savedTokensJson) {
      const savedTokens: TokenBase[] = JSON.parse(savedTokensJson);
      setTokens(savedTokens);
    }

    window.addEventListener('newTokenFound', handleNewToken as EventListener);
    window.addEventListener('tokensLoaded', handleTokensLoaded as EventListener);

    return () => {
      window.removeEventListener('newTokenFound', handleNewToken as EventListener);
      window.removeEventListener('tokensLoaded', handleTokensLoaded as EventListener);
    };
  }, []);

  useEffect(() => {
    // Cargar tokens al inicio
    const bscService = BSCChainService.getInstance();
    bscService.loadAndUpdateTokens().catch(error => {
      console.error('Error cargando tokens:', error);
    });
  }, []);

  const handleNewToken = (event: CustomEvent<{ token: TokenBase }>) => {
    setTokens(prevTokens => {
      const newToken = event.detail.token;
      // Verificar si el token ya existe
      const exists = prevTokens.some(t => 
        t.address.toLowerCase() === newToken.address.toLowerCase()
      );
      
      if (exists) {
        // Si existe, actualizar el token existente
        return prevTokens.map(t => 
          t.address.toLowerCase() === newToken.address.toLowerCase() 
            ? { ...t, ...newToken, updatedAt: new Date() } as TokenBase
            : t
        );
      }
      
      // Si no existe, añadirlo al principio
      return [newToken, ...prevTokens];
    });
  };

  const handleTokensLoaded = (event: CustomEvent<{ tokens: TokenBase[] }>) => {
    setTokens(event.detail.tokens);
  };

  return { tokens };
}
