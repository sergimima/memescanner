import { TokenTabs } from "@/components/token/token-tabs";
import { TokenInfoTab } from "@/components/token/token-info-tab";
import { HoldersTab } from "@/components/token/holders-tab";
import { SocialTab } from "@/components/token/social-tab";
import { SecurityTab } from "@/components/token/security-tab";

// Datos de ejemplo
const tokenData = {
  name: "Example Memecoin",
  symbol: "MEME",
  contract: "0x1234567890abcdef1234567890abcdef12345678",
  chain: "Solana",
  totalSupply: "1,000,000,000",
  marketCap: 5000000,
  price: 0.005,
};

const holdersData = {
  holders: [
    { address: "0x1234...5678", balance: "100,000,000", percentage: 10 },
    { address: "0x2345...6789", balance: "50,000,000", percentage: 5 },
    { address: "0x3456...7890", balance: "30,000,000", percentage: 3 },
  ],
  totalHolders: 1500,
};

const socialData = {
  twitter: {
    followers: 15000,
    engagement: 8.5,
  },
  telegram: {
    members: 25000,
    activeUsers: 5000,
  },
  sentiment: {
    positive: 65,
    neutral: 25,
    negative: 10,
  },
};

const securityData = {
  securityScore: 35,
  liquidityLocked: {
    amount: "$500,000",
    duration: "6 meses",
    platform: "Unicrypt",
  },
  checks: [
    {
      name: "Liquidez Bloqueada",
      passed: true,
      description: "90% de la liquidez bloqueada por 6 meses",
    },
    {
      name: "Contrato Verificado",
      passed: true,
      description: "Código fuente verificado en el explorador",
    },
    {
      name: "Sin Funciones Peligrosas",
      passed: true,
      description: "No se encontraron funciones de mint o pausa",
    },
  ],
};

export default function TokenPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="container mx-auto max-w-4xl">
        <TokenTabs>
          <TokenInfoTab token={tokenData} />
          <HoldersTab {...holdersData} />
          <SocialTab metrics={socialData} />
          <SecurityTab {...securityData} />
        </TokenTabs>
      </div>
    </main>
  );
}
