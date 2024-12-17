'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TokenInfoTab } from "@/components/token/token-info-tab";
import { HoldersTab } from "@/components/token/holders-tab";
import { SocialTab } from "@/components/token/social-tab";
import { SecurityTab } from "@/components/token/security-tab";
import { useTokens } from "@/features/tokens/hooks/useTokens";
import { useParams } from "next/navigation";
import { TokenBase, TokenHolder, TokenAnalysis, TokenScore } from "@/types/token";

export default function TokenPage() {
  const params = useParams();
  const { tokens } = useTokens();

  // Asegurarnos de que address es un string
  const address = typeof params?.address === 'string' ? params.address : '';
  
  const token = tokens.find((t: TokenBase) => t.address.toLowerCase() === address.toLowerCase());

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Token no encontrado</h1>
        <p className="text-gray-600">No se pudo encontrar el token con la dirección: {address}</p>
      </div>
    );
  }

  // Asegurarnos de que el análisis existe
  const analysis = token.analysis || {
    liquidityUSD: 0,
    holders: [],
    buyCount: 0,
    sellCount: 0,
    marketCap: 0,
    price: 0,
    lockedLiquidity: {
      percentage: 0,
      until: new Date(),
      verified: false
    },
    ownership: {
      renounced: false,
      isMultisig: false
    },
    contract: {
      verified: false,
      hasHoneypot: false,
      hasUnlimitedMint: false,
      hasTradingPause: false,
      maxTaxPercentage: 0,
      hasDangerousFunctions: false
    },
    distribution: {
      maxWalletPercentage: 0,
      topHolders: []
    },
    social: {
      telegram: '',
      twitter: '',
      website: ''
    }
  };

  const defaultScore: TokenScore = {
    total: 0,
    security: 0,
    liquidity: 0,
    community: 0
  };

  const score = token.score || defaultScore;

  // Formatear los holders para la visualización
  const holdersData = {
    holders: analysis.holders.map((holder: TokenHolder) => ({
      address: holder.address,
      balance: Number(holder.balance).toLocaleString(),
      percentage: holder.percentage
    })),
    totalHolders: analysis.holders.length
  };

  const socialData = {
    twitter: {
      followers: Number(analysis.social?.twitter) || 0,
      engagement: Number(analysis.social?.twitter) || 0
    },
    telegram: {
      members: Number(analysis.social?.telegram) || 0,
      activeUsers: Number(analysis.social?.telegram) || 0
    },
    sentiment: {
      positive: Number(analysis.social?.twitter) || 0,
      neutral: Number(analysis.social?.twitter) || 0,
      negative: Number(analysis.social?.twitter) || 0
    }
  };

  const securityData = {
    securityScore: score.security,
    liquidityLocked: {
      amount: `$${analysis.liquidityUSD.toLocaleString()}`,
      duration: analysis.lockedLiquidity.until ? new Date(analysis.lockedLiquidity.until).toISOString() : 'N/A',
      platform: analysis.lockedLiquidity.verified ? 'Verificado' : 'N/A'
    },
    checks: [
      {
        name: 'Contrato Verificado',
        passed: analysis.contract.verified,
        description: 'El código del contrato está verificado en el explorador'
      },
      {
        name: 'Liquidez Bloqueada',
        passed: analysis.lockedLiquidity.verified,
        description: 'La liquidez está bloqueada en una plataforma confiable'
      },
      {
        name: 'Sin Funciones Peligrosas',
        passed: !analysis.contract.hasDangerousFunctions,
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
              <TokenInfoTab token={{
                name: token.name,
                symbol: token.symbol,
                contract: token.address,
                chain: 'BSC',
                totalSupply: token.totalSupply,
                decimals: token.decimals,
                marketCap: analysis.marketCap,
                price: analysis.price
              }} />
            </TabsContent>
            <TabsContent value="holders">
              <HoldersTab {...holdersData} decimals={token.decimals} />
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
