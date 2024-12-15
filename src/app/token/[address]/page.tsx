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
    return <div>Token no encontrado</div>;
  }

  // Valores por defecto para analysis y score
  const defaultAnalysis: TokenAnalysis = {
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
      teamWalletPercentage: 0,
      top10HoldersPercentage: 0
    },
    social: {
      followers: 0,
      engagement: 0,
      sentiment: {
        positive: 0,
        neutral: 0,
        negative: 0
      }
    },
    liquidityLocked: false
  };

  const defaultScore: TokenScore = {
    total: 0,
    security: 0,
    liquidity: 0,
    community: 0
  };

  const analysis = token.analysis || defaultAnalysis;
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
      followers: analysis.social?.followers ?? 0,
      engagement: analysis.social?.engagement ?? 0
    },
    telegram: {
      members: analysis.social?.followers ?? 0,
      activeUsers: analysis.social?.engagement ?? 0
    },
    sentiment: {
      positive: analysis.social?.sentiment?.positive ?? 0,
      neutral: analysis.social?.sentiment?.neutral ?? 0,
      negative: analysis.social?.sentiment?.negative ?? 0
    }
  };

  const securityData = {
    securityScore: score.security,
    liquidityLocked: {
      amount: `$${analysis.liquidityUSD.toLocaleString()}`,
      duration: analysis.lockedLiquidity.until.toISOString(), // Convertir Date a string
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
        passed: analysis.liquidityLocked,
        description: 'La liquidez está bloqueada en una plataforma confiable'
      },
      {
        name: 'Sin Funciones Peligrosas',
        passed: !analysis.contract.hasDangerousFunctions,
        description: 'El contrato no tiene funciones que puedan ser peligrosas'
      }
    ]
  };

  const tokenInfo = {
    token: {
      name: token.name,
      symbol: token.symbol,
      contract: token.address,
      chain: token.network || 'BSC', // Valor por defecto si network es undefined
      totalSupply: Number(token.totalSupply).toLocaleString(),
      marketCap: analysis.marketCap,
      price: analysis.price
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-6">{token.name}</h1>
        <Tabs defaultValue="info">
          <TabsList>
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="holders">Holders</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="security">Seguridad</TabsTrigger>
          </TabsList>
          <TabsContent value="info">
            <TokenInfoTab {...tokenInfo} />
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
  );
}
