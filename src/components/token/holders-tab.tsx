import { formatNumber, formatPercentage } from "@/utils/format";
import { useState, useEffect } from 'react';

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
  tokenAddress: string;
}

const truncateAddress = (address: string) => {
  if (!address) return 'Dirección Desconocida';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export function HoldersTab({ holders, totalHolders, decimals, tokenAddress }: HoldersTabProps) {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadHolders = async () => {
      setIsLoading(true);
      try {
        // Disparar evento para actualizar holders
        const updateEvent = new CustomEvent('updateHolders', {
          detail: { address: tokenAddress }
        });
        window.dispatchEvent(updateEvent);
      } finally {
        setIsLoading(false);
      }
    };

    loadHolders();
  }, [tokenAddress]);

  console.log('HoldersTab - holders:', holders);
  console.log('HoldersTab - totalHolders:', totalHolders);
  console.log('HoldersTab - decimals:', decimals);
  console.log('HoldersTab - tokenAddress:', tokenAddress);

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">Cargando holders...</p>
      </div>
    );
  }

  if (!holders || holders.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">No hay holders disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Top Holders</h3>
        <p className="text-sm text-muted-foreground">Total: {totalHolders.toLocaleString()}</p>
      </div>
      <div className="space-y-2">
        {holders.map((holder, index) => {
          console.log('Renderizando holder:', holder);
          const holderAddress = holder.address || 'Dirección Desconocida';
          
          return (
            <div key={`${holderAddress}-${index}`} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex flex-col space-y-1 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0">
                <span className="text-sm text-muted-foreground">#{index + 1}</span>
                {holderAddress === 'Dirección Desconocida' ? (
                  <span className="font-mono text-sm text-muted-foreground">
                    {holderAddress}
                  </span>
                ) : (
                  <a 
                    href={`https://bscscan.com/address/${holderAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-sm text-primary hover:underline"
                    title={holderAddress}
                  >
                    {truncateAddress(holderAddress)}
                  </a>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{formatNumber(holder.balance, decimals)}</p>
                <p className="text-xs text-muted-foreground">{formatPercentage(holder.percentage)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
