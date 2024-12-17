import { formatNumber, formatPercentage } from "@/utils/format";

interface Holder {
  address: string;
  balance: string;
  percentage: number;
  decimals?: number;
}

interface HoldersTabProps {
  holders: Holder[];
  totalHolders: number;
  decimals: number;
}

export function HoldersTab({ holders, totalHolders, decimals }: HoldersTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Top Holders</h3>
        <p className="text-sm text-muted-foreground">Total: {totalHolders.toLocaleString()}</p>
      </div>
      <div className="space-y-2">
        {holders.map((holder, index) => (
          <div key={holder.address} className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">#{index + 1}</span>
              <span className="font-mono text-sm">{holder.address}</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{formatNumber(holder.balance, decimals)}</p>
              <p className="text-xs text-muted-foreground">{formatPercentage(holder.percentage)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
