export interface TokenAnalysis {
  liquidityUSD: number;
  holders: TokenHolder[];
  buyCount: number;
  sellCount: number;
  marketCap: number;
  price: number;
  lockedLiquidity: {
    percentage: number;
    until: Date;
    verified: boolean;
  };
  ownership: {
    renounced: boolean;
    isMultisig: boolean;
  };
  contract: {
    verified: boolean;
    hasHoneypot: boolean;
    hasUnlimitedMint: boolean;
    hasTradingPause: boolean;
    maxTaxPercentage: number;
    hasDangerousFunctions: boolean;
  };
  distribution: {
    maxWalletPercentage: number;
    topHolders: TokenHolder[];
  };
  social: {
    telegram: string;
    twitter: string;
    website: string;
  };
  liquidityLocked: boolean;
}

export interface TokenScore {
  total: number;
  security: number;
  liquidity: number;
  community: number;
}

export interface TokenHolder {
  address: string;
  balance: string;
  percentage: number;
}

export interface TokenBase {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  network: string;
  createdAt: Date;
  updatedAt?: Date;
  analysis: TokenAnalysis;
  score: TokenScore;
}
