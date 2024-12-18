'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TokenInfoTab } from "@/components/token/token-info-tab";
import { HoldersTab } from "@/components/token/holders-tab";
import { SocialTab } from "@/components/token/social-tab";
import { SecurityTab } from "@/components/token/security-tab";
import { useTokens } from "@/features/tokens/hooks/useTokens";
import { useParams } from "next/navigation";
import { TokenBase } from "@/types/token";
import { useState, useEffect } from "react";

export default function TokenPage() {
  const params = useParams();
  const { tokens, updateToken } = useTokens({ autoRefresh: false }); // Desactivar análisis automático
  const [isLoading, setIsLoading] = useState(false);
  const [localToken, setLocalToken] = useState<TokenBase | null>(null);

  // Asegurarnos de que address es un string
  const address = typeof params?.address === 'string' ? params.address : '';
  
  const token = localToken || tokens.find((t: TokenBase) => t.address.toLowerCase() === address.toLowerCase());

  useEffect(() => {
    const handleTokenUpdate = (event: CustomEvent<{ token: TokenBase }>) => {
      const updatedToken = event.detail.token;
      if (updatedToken.address.toLowerCase() === address.toLowerCase()) {
        setLocalToken(updatedToken);
      }
    };

    window.addEventListener('tokenUpdated', handleTokenUpdate as EventListener);
    return () => {
      window.removeEventListener('tokenUpdated', handleTokenUpdate as EventListener);
    };
  }, [address]);

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Token no encontrado</h1>
        <p className="text-gray-600">No se pudo encontrar el token con la dirección: {address}</p>
      </div>
    );
  }

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await updateToken(token.address);
      // Esperar un momento para que se actualice el estado
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Error actualizando el token:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Preparar datos para el TokenInfoTab
  const tokenInfo = {
    name: token.name,
    symbol: token.symbol,
    contract: token.address,
    chain: 'BSC',
    totalSupply: token.totalSupply,
    decimals: token.decimals,
    marketCap: token.analysis?.marketCap || 0,
    price: String(token.analysis?.price || '0'), // Asegurar que siempre es string
    liquidityUSD: token.analysis?.liquidityUSD,
    liquidityLocked: token.analysis?.liquidityLocked || false,
    liquidityLockedPercentage: token.analysis?.lockedLiquidity?.percentage || 0,
    liquidityLockedUntil: token.analysis?.lockedLiquidity?.until || 'N/A',
    holders: token.analysis?.holders?.length || 0,
    buyCount: token.analysis?.buyCount,
    sellCount: token.analysis?.sellCount,
    canTrade: token.analysis?.canTrade || false
  };

  console.log('[UI] Token completo:', token);
  console.log('[UI] Token analysis:', token.analysis);
  console.log('[UI] Token info preparado:', tokenInfo);

  // Preparar datos para el HoldersTab
  const holdersData = {
    holders: token.analysis?.holders || [],
    totalHolders: token.analysis?.holders?.length || 0,
    decimals: token.decimals
  };

  // Preparar datos para el SocialTab
  const socialData = {
    twitter: {
      followers: 0, // Por ahora no tenemos estos datos
      engagement: 0
    },
    telegram: {
      members: 0, // Por ahora no tenemos estos datos
      activeUsers: 0
    },
    sentiment: {
      positive: 0,
      neutral: 0,
      negative: 0
    }
  };

  // Preparar datos para el SecurityTab
  const securityData = {
    securityScore: token.score?.security || 0,
    liquidityLocked: {
      amount: token.analysis?.lockedLiquidity?.percentage?.toString() || '0',
      duration: typeof token.analysis?.lockedLiquidity?.until === 'string' 
        ? token.analysis.lockedLiquidity.until 
        : 'N/A',
      platform: token.analysis?.liquidityLocked ? 'PinkSale' : 'Desconocido'
    },
    checks: [
      {
        name: 'Contrato Verificado',
        passed: token.analysis?.contract?.verified || false,
        description: 'El código del contrato está verificado en el explorador'
      },
      {
        name: 'Liquidez Bloqueada',
        passed: token.analysis?.liquidityLocked || false,
        description: 'La liquidez está bloqueada en una plataforma confiable'
      },
      {
        name: 'Sin Funciones Peligrosas',
        passed: !token.analysis?.contract?.hasDangerousFunctions || false,
        description: 'El contrato no tiene funciones que puedan ser peligrosas'
      }
    ]
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 dark:from-purple-950 dark:via-gray-900 dark:to-blue-950">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-card/90 backdrop-blur-sm rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-6 text-card-foreground">{token.name}</h1>
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="info">Información</TabsTrigger>
              <TabsTrigger value="holders">Holders</TabsTrigger>
              <TabsTrigger value="social">Social</TabsTrigger>
              <TabsTrigger value="security">Seguridad</TabsTrigger>
            </TabsList>
            <TabsContent value="info">
              <TokenInfoTab 
                token={tokenInfo} 
                onRefresh={handleRefresh}
                isLoading={isLoading}
              />
            </TabsContent>
            <TabsContent value="holders">
              <HoldersTab {...holdersData} />
            </TabsContent>
            <TabsContent value="social">
              <SocialTab metrics={socialData} />
            </TabsContent>
            <TabsContent value="security">
              <SecurityTab {...securityData} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
}
