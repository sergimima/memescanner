'use client'

import { TokenTabs } from "@/components/token/token-tabs";
import { TokenInfoTab } from "@/components/token/token-info-tab";
import { HoldersTab } from "@/components/token/holders-tab";
import { SocialTab } from "@/components/token/social-tab";
import { SecurityTab } from "@/components/token/security-tab";
import { useToken } from "@/features/tokens/hooks/useToken";
import { useParams } from "next/navigation";
import { TokenHolder } from "@/features/tokens/types/token";

export default function TokenPage() {
  const { address } = useParams()
  const { token, loading, error } = useToken(address as string)

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando información del token...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen p-8">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <h2 className="text-xl font-semibold text-red-700 dark:text-red-400">Error</h2>
            <p className="text-red-600 dark:text-red-300">{error.message}</p>
          </div>
        </div>
      </main>
    )
  }

  if (!token) {
    return (
      <main className="min-h-screen p-8">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <h2 className="text-xl font-semibold text-yellow-700 dark:text-yellow-400">Token no encontrado</h2>
            <p className="text-yellow-600 dark:text-yellow-300">No se pudo encontrar información para este token.</p>
          </div>
        </div>
      </main>
    )
  }

  const holdersData = {
    holders: token.analysis.holders.map((holder: TokenHolder) => ({
      address: holder.address,
      balance: holder.balance,
      percentage: holder.percentage
    })),
    totalHolders: token.analysis.holders.length
  }

  const socialData = {
    twitter: {
      followers: token.analysis.social?.followers ?? 0,
      engagement: token.analysis.social?.engagement ?? 0
    },
    telegram: {
      members: token.analysis.social?.followers ?? 0,
      activeUsers: token.analysis.social?.engagement ?? 0
    },
    sentiment: {
      positive: token.analysis.social?.sentiment?.positive ?? 0,
      neutral: token.analysis.social?.sentiment?.neutral ?? 0,
      negative: token.analysis.social?.sentiment?.negative ?? 0
    }
  }

  const securityData = {
    securityScore: token.score.security,
    liquidityLocked: {
      amount: `$${token.analysis.liquidityUSD.toLocaleString()}`,
      duration: token.analysis.liquidityLockDuration ?? 'No bloqueada',
      platform: token.analysis.liquidityLockPlatform ?? 'N/A'
    },
    checks: [
      {
        name: 'Contrato Verificado',
        passed: token.analysis.contract.verified,
        description: 'El código del contrato está verificado en el explorador'
      },
      {
        name: 'Liquidez Bloqueada',
        passed: token.analysis.liquidityLocked,
        description: 'La liquidez está bloqueada en una plataforma confiable'
      },
      {
        name: 'Sin Funciones Peligrosas',
        passed: !token.analysis.contract.hasDangerousFunctions,
        description: 'El contrato no tiene funciones que puedan ser peligrosas'
      }
    ]
  }

  return (
    <main className="min-h-screen p-8">
      <div className="container mx-auto max-w-4xl">
        <TokenTabs>
          <TokenInfoTab token={{
            name: token.name,
            symbol: token.symbol,
            contract: token.address,
            chain: token.network,
            totalSupply: token.totalSupply,
            marketCap: token.analysis.marketCap,
            price: token.analysis.price
          }} />
          <HoldersTab {...holdersData} />
          <SocialTab metrics={socialData} />
          <SecurityTab {...securityData} />
        </TokenTabs>
      </div>
    </main>
  );
}
