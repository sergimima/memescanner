import { TokenBase, TokenAnalysis, TokenScore } from '../types/token'

export abstract class BaseChainService {
  abstract readonly chainId: string
  abstract readonly chainName: string
  abstract readonly scanApiUrl: string
  abstract readonly scanApiKey: string

  abstract getNewTokens(): Promise<TokenBase[]>
  abstract analyzeToken(address: string): Promise<TokenAnalysis>
  abstract calculateScore(analysis: TokenAnalysis): TokenScore

  protected isValidMemecoin(analysis: TokenAnalysis): boolean {
    return (
      analysis.liquidityUSD >= 5000 &&
      analysis.lockedLiquidity.percentage >= 80 &&
      analysis.distribution.maxWalletPercentage <= 2 &&
      analysis.distribution.teamWalletPercentage <= 5 &&
      analysis.distribution.top10HoldersPercentage <= 30 &&
      analysis.contract.maxTaxPercentage <= 10 &&
      !analysis.contract.hasHoneypot &&
      !analysis.contract.hasUnlimitedMint &&
      !analysis.contract.hasTradingPause
    )
  }

  protected calculateBaseScore(analysis: TokenAnalysis): TokenScore {
    let security = 0
    let liquidity = 0
    let community = 0

    // Security Score (40 points max)
    if (analysis.contract.verified) security += 15
    if (analysis.lockedLiquidity.verified) security += 2
    if (analysis.lockedLiquidity.percentage > 90) security += 3
    if (analysis.ownership.renounced || analysis.ownership.isMultisig) security += 10

    // Liquidity Score (30 points max)
    if (analysis.liquidityUSD >= 50000) liquidity += 15
    else if (analysis.liquidityUSD >= 20000) liquidity += 10
    else if (analysis.liquidityUSD >= 5000) liquidity += 5

    // Community Score (30 points max)
    if (analysis.holders >= 500) community += 10
    if (analysis.social?.followers && analysis.social.followers >= 1000) community += 10
    if (analysis.social?.engagement && analysis.social.engagement >= 0.5) community += 10

    const total = security + liquidity + community

    return {
      total,
      security,
      liquidity,
      community
    }
  }
}
