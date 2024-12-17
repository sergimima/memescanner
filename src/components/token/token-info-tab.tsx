import { formatNumber, formatUSD } from "@/utils/format"

interface TokenInfoTabProps {
  token: {
    name: string;
    symbol: string;
    contract: string;
    chain: string;
    totalSupply: string;
    decimals: number;
    marketCap: number;
    price: number;
  }
}

export function TokenInfoTab({ token }: TokenInfoTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Nombre</p>
          <p className="text-lg font-medium">{token.name}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Símbolo</p>
          <p className="text-lg font-medium">{token.symbol}</p>
        </div>
        <div className="col-span-2">
          <p className="text-sm text-muted-foreground">Contrato</p>
          <p className="text-lg font-medium break-all">{token.contract}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Blockchain</p>
          <p className="text-lg font-medium">{token.chain}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Supply Total</p>
          <p className="text-lg font-medium">{formatNumber(token.totalSupply, token.decimals)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Market Cap</p>
          <p className="text-lg font-medium">{formatUSD(token.marketCap)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Precio</p>
          <p className="text-lg font-medium">{formatUSD(token.price)}</p>
        </div>
      </div>
    </div>
  );
}
