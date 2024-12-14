import { ScoreIndicator } from "../ui/score-indicator";

interface TokenDetailsProps {
  token: {
    name: string;
    securityScore: number;
    liquidityScore: number;
    communityScore: number;
    contract: string;
    liquidityLocked: string;
    holders: number;
  }
}

export function TokenDetails({ token }: TokenDetailsProps) {
  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-3xl font-bold">{token.name}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Contract: {token.contract}
        </p>
      </div>

      <div className="space-y-4">
        <ScoreIndicator 
          score={token.securityScore} 
          maxScore={40} 
          label="Security Score" 
        />
        <ScoreIndicator 
          score={token.liquidityScore} 
          maxScore={30} 
          label="Liquidity Score" 
        />
        <ScoreIndicator 
          score={token.communityScore} 
          maxScore={30} 
          label="Community Score" 
        />
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4">
        <div>
          <p className="text-sm text-muted-foreground">Liquidity Locked</p>
          <p className="text-lg font-medium">{token.liquidityLocked}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Holders</p>
          <p className="text-lg font-medium">{token.holders.toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}
