'use client'

import { useState, useEffect, useMemo } from 'react'
import { TokenBase } from '../types/token'
import { BSCChainService } from '../services/bsc-chain'
import { useNetwork } from '@/features/network/network-context'

export interface UseTokenDetectionProps {
  autoRefresh?: boolean;
}

export function useTokenDetection({ autoRefresh = false }: UseTokenDetectionProps = {}) {
  const [tokens, setTokens] = useState<TokenBase[]>(() => {
    // Cargar tokens guardados al inicializar el estado
    try {
      const savedTokensJson = localStorage.getItem('bsc_tokens');  // Usar la misma clave que BSCChainService
      if (savedTokensJson) {
        const savedTokens = JSON.parse(savedTokensJson);
        console.log(`[${new Date().toLocaleTimeString()}] Cargando ${savedTokens.length} tokens guardados en el estado inicial`);
        return savedTokens;
      }
    } catch (error) {
      console.error(`[${new Date().toLocaleTimeString()}] Error cargando tokens guardados en el estado inicial:`, error);
    }
    return [];
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { network } = useNetwork()

  const chainService = useMemo(() => {
    if (network === 'bsc') {
      return BSCChainService.getInstance()
    }
    return null
  }, [network])

  const addToken = (token: TokenBase) => {
    setTokens(prevTokens => {
      // Verificar si el token ya existe
      if (prevTokens.some(t => t.address.toLowerCase() === token.address.toLowerCase())) {
        return prevTokens;
      }
      // Añadir el nuevo token al principio del array
      return [token, ...prevTokens];
    });
  };

  const detectNewTokens = async () => {
    try {
      if (!chainService) {
        setError(new Error(`La red ${network} no está soportada todavía`))
        setTokens([])
        return
      }

      setLoading(true)
      setError(null)
      const newTokens = await chainService.getNewTokens()
      
      // Crear un Map para mantener solo la última versión de cada token
      const tokenMap = new Map(
        tokens.map(token => [token.address.toLowerCase(), token])
      );

      // Actualizar o añadir nuevos tokens
      newTokens.forEach(token => {
        const address = token.address.toLowerCase();
        if (!tokenMap.has(address)) {
          tokenMap.set(address, token);
        }
      });

      // Convertir el Map de vuelta a un array
      const updatedTokens = Array.from(tokenMap.values());
      
      // Ordenar por fecha de creación, más recientes primero
      updatedTokens.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      setTokens(updatedTokens)
    } catch (err) {
      setError(err as Error)
      console.error('Error detecting new tokens:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const handleNewToken = async (event: Event) => {
      const customEvent = event as CustomEvent<{ token: TokenBase }>;
      console.log(`[${new Date().toLocaleTimeString()}] Nuevo token detectado:`, customEvent.detail.token);
      
      setTokens(prevTokens => {
        // Crear un Map con los tokens existentes
        const tokenMap = new Map(
          prevTokens.map(token => [token.address.toLowerCase(), token])
        );

        // Añadir o actualizar el nuevo token
        const newToken = customEvent.detail.token;
        tokenMap.set(newToken.address.toLowerCase(), newToken);

        // Convertir el Map de vuelta a un array y ordenar
        const updatedTokens = Array.from(tokenMap.values()).sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });

        // Guardar en localStorage
        try {
          localStorage.setItem('bsc_tokens', JSON.stringify(updatedTokens));
        } catch (error) {
          console.error(`[${new Date().toLocaleTimeString()}] Error guardando tokens:`, error);
        }

        return updatedTokens;
      });
      
      // Iniciar análisis automático
      if (chainService) {
        try {
          setLoading(true);
          console.log(`[${new Date().toLocaleTimeString()}] Iniciando análisis automático para:`, customEvent.detail.token.address);
          chainService.queueTokenAnalysis(customEvent.detail.token.address);
        } catch (error) {
          console.error(`[${new Date().toLocaleTimeString()}] Error en análisis automático:`, error);
          setError(error as Error);
        } finally {
          setLoading(false);
        }
      }
    };

    if (chainService) {
      window.addEventListener('newTokenFound', handleNewToken);
      console.log(`[${new Date().toLocaleTimeString()}] Listener de nuevos tokens activado`);
    }

    return () => {
      if (chainService) {
        window.removeEventListener('newTokenFound', handleNewToken);
        console.log(`[${new Date().toLocaleTimeString()}] Listener de nuevos tokens desactivado`);
      }
    };
  }, [chainService]);

  // Analizar tokens existentes
  useEffect(() => {
    const analyzeExistingTokens = async () => {
      if (!chainService || tokens.length === 0) return;

      console.log(`[${new Date().toLocaleTimeString()}] Iniciando análisis de ${tokens.length} tokens existentes`);
      setLoading(true);

      try {
        for (const token of tokens) {
          chainService.queueTokenAnalysis(token.address);
        }
      } finally {
        setLoading(false);
      }
    };

    analyzeExistingTokens();
  }, [chainService, network]); // Se ejecuta cuando cambia la red o el servicio

  // Detectar tokens iniciales y configurar polling
  useEffect(() => {
    detectNewTokens()
    if (autoRefresh) {
      // Configurar un intervalo para detectar nuevos tokens cada 2 minutos
      const interval = setInterval(detectNewTokens, 120000)
      return () => clearInterval(interval)
    }
  }, [chainService, autoRefresh])

  return {
    tokens,
    loading,
    error,
    refreshTokens: detectNewTokens
  }
}
