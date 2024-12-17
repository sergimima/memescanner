import { useState, useEffect } from 'react';
import { TokenBase } from '@/types/token';
import { BSCChainService } from '../services/bsc-chain';
import { useNetwork } from '@/features/network/network-context';

export function useTokens() {
  const [tokens, setTokens] = useState<TokenBase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { network } = useNetwork();

  const chainService = network === 'bsc' ? BSCChainService.getInstance() : null;

  useEffect(() => {
    const loadSavedTokens = () => {
      try {
        const savedTokensJson = localStorage.getItem('bsc_tokens');
        if (savedTokensJson) {
          const savedTokens: TokenBase[] = JSON.parse(savedTokensJson);
          console.log(`[${new Date().toLocaleTimeString()}] Cargando ${savedTokens.length} tokens guardados`);
          setTokens(savedTokens);
        }
      } catch (error) {
        console.error('Error cargando tokens guardados:', error);
        setError(error as Error);
      }
    };

    loadSavedTokens();

    // Configurar event listeners
    window.addEventListener('newTokenFound', handleNewToken as EventListener);
    window.addEventListener('tokensLoaded', handleTokensLoaded as EventListener);

    return () => {
      window.removeEventListener('newTokenFound', handleNewToken as EventListener);
      window.removeEventListener('tokensLoaded', handleTokensLoaded as EventListener);
    };
  }, [network]);

  const handleNewToken = (event: CustomEvent<{ token: TokenBase }>) => {
    setTokens(prevTokens => {
      const newToken = event.detail.token;
      // Verificar si el token ya existe
      const existingTokenIndex = prevTokens.findIndex(t => 
        t.address.toLowerCase() === newToken.address.toLowerCase()
      );
      
      if (existingTokenIndex !== -1) {
        // Si existe y hay cambios, actualizar
        const existingToken = prevTokens[existingTokenIndex];
        const hasChanges = JSON.stringify(existingToken) !== JSON.stringify(newToken);
        
        if (!hasChanges) {
          return prevTokens;
        }

        const updatedTokens = [...prevTokens];
        updatedTokens[existingTokenIndex] = { 
          ...existingToken, 
          ...newToken, 
          updatedAt: new Date() 
        };
        
        // Guardar en localStorage
        try {
          localStorage.setItem('bsc_tokens', JSON.stringify(updatedTokens));
        } catch (error) {
          console.error('Error guardando tokens:', error);
        }
        
        return updatedTokens;
      }
      
      // Si no existe, añadirlo al principio
      const newTokens = [{ ...newToken, createdAt: new Date(), updatedAt: new Date() }, ...prevTokens];
      
      // Guardar en localStorage
      try {
        localStorage.setItem('bsc_tokens', JSON.stringify(newTokens));
      } catch (error) {
        console.error('Error guardando tokens:', error);
      }
      
      return newTokens;
    });
  };

  const handleTokensLoaded = (event: CustomEvent<{ tokens: TokenBase[] }>) => {
    const newTokens = event.detail.tokens;
    setTokens(prevTokens => {
      // Combinar tokens existentes con nuevos, evitando duplicados
      const tokenMap = new Map(prevTokens.map(token => [token.address.toLowerCase(), token]));
      
      newTokens.forEach(token => {
        const existingToken = tokenMap.get(token.address.toLowerCase());
        if (!existingToken) {
          tokenMap.set(token.address.toLowerCase(), { 
            ...token, 
            createdAt: new Date(),
            updatedAt: new Date()
          });
        } else {
          // Actualizar solo si hay cambios
          const hasChanges = JSON.stringify(existingToken) !== JSON.stringify(token);
          if (hasChanges) {
            tokenMap.set(token.address.toLowerCase(), { 
              ...existingToken,
              ...token,
              updatedAt: new Date()
            });
          }
        }
      });

      const updatedTokens = Array.from(tokenMap.values());
      
      // Guardar en localStorage
      try {
        localStorage.setItem('bsc_tokens', JSON.stringify(updatedTokens));
      } catch (error) {
        console.error('Error guardando tokens:', error);
      }
      
      return updatedTokens;
    });
  };

  const refreshTokens = async () => {
    if (!chainService) {
      setError(new Error(`La red ${network} no está soportada todavía`));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await chainService.loadAndUpdateTokens();
    } catch (error) {
      console.error('Error actualizando tokens:', error);
      setError(error as Error);
    } finally {
      setLoading(false);
    }
  };

  return { 
    tokens, 
    loading, 
    error,
    refreshTokens
  };
}
