interface TokenCardProps {
  name: string;
  score: number;
  liquidity: number;
  holders: number;
}

export function TokenCard({ name, score, liquidity, holders }: TokenCardProps) {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-semibold">{name}</h3>
        <div className="text-xl font-bold text-primary">
          Score: {score}
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Liquidity:</span>
          <span>${liquidity.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Holders:</span>
          <span>{holders.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}
