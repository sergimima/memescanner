import { formatNumber, formatUSD } from "@/utils/format"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { 
  Coins, 
  Link as LinkIcon, 
  DollarSign, 
  Lock, 
  Users, 
  BarChart3,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Tag,
  Network
} from "lucide-react";

interface TokenInfoTabProps {
  token: {
    name: string;
    symbol: string;
    contract: string;
    chain: string;
    totalSupply: string;
    decimals: number;
    marketCap: number;
    price: string;
    liquidityUSD?: number;
    liquidityLocked?: boolean;
    liquidityLockedPercentage?: number;
    liquidityLockedUntil?: string;
    holders?: number;
    buyCount?: number;
    sellCount?: number;
    canTrade?: boolean;
  }
  onRefresh?: () => void;
  isLoading?: boolean;
}

const TradeButton = ({ tokenAddress }: { tokenAddress: string }) => {
  return (
    <Link 
      href={`https://pancakeswap.finance/swap?outputCurrency=${tokenAddress}`}
      target="_blank"
      className="flex items-center gap-2 px-4 py-2 bg-[#1FC7D4] hover:bg-[#1AB4BF] text-white rounded-lg transition-colors"
    >
      <Image
        src="/pancakeswap.svg"
        alt="PancakeSwap"
        width={24}
        height={24}
        className="w-6 h-6"
      />
      <span>Trade on PancakeSwap</span>
    </Link>
  );
};

const formatValue = (value: number | string | undefined, prefix: string = '') => {
  if (value === undefined || value === '0' || value === 0) {
    return 'N/A';
  }
  
  if (typeof value === 'string') {
    const num = parseFloat(value);
    // Siempre mostrar todos los decimales para números pequeños
    if (num < 1) {
      const decimals = value.split('.')[1]?.length || 10;
      return `${prefix}${num.toFixed(decimals)}`;
    }
  }
  
  return `${prefix}${typeof value === 'number' ? value.toLocaleString() : parseFloat(value).toLocaleString()}`;
};

const formatUSDValue = (value: number | string | undefined) => {
  if (value === undefined || value === '0' || value === 0) return 'N/A';
  return `${formatValue(value)} USDT`;
};

export function TokenInfoTab({ token, onRefresh, isLoading }: TokenInfoTabProps) {
  const handleRefresh = () => {
    if (!isLoading && onRefresh) {
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Información del Token</h2>
        <div className="flex items-center gap-4">
          <TradeButton tokenAddress={token.contract} />
          <button
            onClick={handleRefresh}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isLoading}
          >
            <RefreshCw className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Información básica */}
        <div className="bg-background/50 dark:bg-background/50 p-6 rounded-xl shadow-sm border border-border">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Información Básica</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Nombre</p>
                <p className="font-medium text-foreground">{token.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Símbolo</p>
                <p className="font-medium text-foreground">{token.symbol}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Contrato</p>
                <p className="font-medium font-mono text-sm text-foreground">{token.contract}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Network className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Blockchain</p>
                <p className="font-medium text-foreground">{token.chain}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Supply Total</p>
                <p className="font-medium text-foreground">{formatNumber(token.totalSupply, token.decimals)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Métricas de mercado */}
        <div className="bg-background/50 dark:bg-background/50 p-6 rounded-xl shadow-sm border border-border">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Métricas de Mercado</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Market Cap</p>
                <p className="font-medium text-foreground">{formatUSDValue(token.marketCap)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Precio</p>
                <p className="font-medium text-foreground">{formatUSDValue(token.price)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Liquidez</p>
                <div>
                  <p className="font-medium text-foreground">{formatUSDValue(token.liquidityUSD)}</p>
                  <p className="text-sm text-muted-foreground">
                    {token.liquidityLocked ? '🔒' : '🔓'} {token.liquidityLockedPercentage || 0}% Bloqueada
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas de comunidad */}
        <div className="bg-background/50 dark:bg-background/50 p-6 rounded-xl shadow-sm border border-border">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Estadísticas de Comunidad</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Holders</p>
                <p className="font-medium text-foreground">{formatValue(token.holders)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas de Trading */}
        <div className="bg-background/50 dark:bg-background/50 p-6 rounded-xl shadow-sm border border-border">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Estadísticas de Trading</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500 dark:text-green-400" />
              <div>
                <p className="text-sm text-muted-foreground">Compras (24h)</p>
                <p className="font-medium text-foreground">{formatValue(token.buyCount)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-500 dark:text-red-400" />
              <div>
                <p className="text-sm text-muted-foreground">Ventas (24h)</p>
                <p className="font-medium text-foreground">{formatValue(token.sellCount)}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Estado Trading</p>
              <p className="font-medium text-foreground">
                {token.canTrade ? '✅ Tradeable' : '❌ No Tradeable'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
