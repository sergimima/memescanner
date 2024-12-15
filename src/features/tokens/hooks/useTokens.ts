import { useState, useEffect } from 'react';
import { TokenBase } from '@/types/token';

export function useTokens() {
  const [tokens, setTokens] = useState<TokenBase[]>([]);

  useEffect(() => {
    const handleNewToken = (event: CustomEvent<{ token: TokenBase }>) => {
      setTokens(prevTokens => [event.detail.token, ...prevTokens]);
    };

    const handleTokensLoaded = (event: CustomEvent<{ tokens: TokenBase[] }>) => {
      setTokens(event.detail.tokens);
    };

    window.addEventListener('newTokenFound', handleNewToken as EventListener);
    window.addEventListener('tokensLoaded', handleTokensLoaded as EventListener);

    return () => {
      window.removeEventListener('newTokenFound', handleNewToken as EventListener);
      window.removeEventListener('tokensLoaded', handleTokensLoaded as EventListener);
    };
  }, []);

  return { tokens };
}
