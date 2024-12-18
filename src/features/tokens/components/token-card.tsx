'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TokenBase } from "../types/token"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { formatNumber } from "@/lib/utils"

interface TokenCardProps {
  token: TokenBase
  onAnalyze?: () => void
  isLoading?: boolean
}

export function TokenCard({ token, onAnalyze, isLoading }: TokenCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{token.name}</CardTitle>
            <CardDescription>{token.symbol}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {token.score && (
              <div className="text-right">
                <div className="text-sm font-medium">
                  Score: {token.score.total}/100
                </div>
                {token.createdAt && (
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(token.createdAt, { addSuffix: true, locale: es })}
                  </div>
                )}
              </div>
            )}
            <Button 
              variant="outline" 
              size="icon"
              onClick={onAnalyze}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Información básica */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium mb-1">Supply Total</div>
            <div className="text-sm">{formatNumber(Number(token.totalSupply))}</div>
          </div>
          {token.analysis?.holders && (
            <div>
              <div className="text-sm font-medium mb-1">Holders</div>
              <div className="text-sm">{token.analysis.holders.length}</div>
            </div>
          )}
          {token.analysis?.liquidityUSD !== undefined && (
            <div>
              <div className="text-sm font-medium mb-1">Liquidez</div>
              <div className="text-sm">${formatNumber(token.analysis.liquidityUSD)}</div>
            </div>
          )}
          {token.analysis?.marketCap !== undefined && (
            <div>
              <div className="text-sm font-medium mb-1">Market Cap</div>
              <div className="text-sm">${formatNumber(token.analysis.marketCap)}</div>
            </div>
          )}
        </div>

        {/* Score */}
        {token.score && (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Seguridad</span>
                <span>{token.score.security}/40</span>
              </div>
              <Progress value={(token.score.security / 40) * 100} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Liquidez</span>
                <span>{token.score.liquidity}/30</span>
              </div>
              <Progress value={(token.score.liquidity / 30) * 100} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Comunidad</span>
                <span>{token.score.community}/30</span>
              </div>
              <Progress value={(token.score.community / 30) * 100} />
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <div className="w-full space-y-2">
          {/* Enlaces sociales */}
          {token.analysis?.social?.telegram && (
            <div className="text-sm">
              <span className="font-medium">Telegram:</span>{" "}
              <a
                href={token.analysis.social.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Unirse al grupo
              </a>
            </div>
          )}
          {token.analysis?.social?.twitter && (
            <div className="text-sm">
              <span className="font-medium">Twitter:</span>{" "}
              <a
                href={token.analysis.social.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Ver perfil
              </a>
            </div>
          )}
          {token.analysis?.social?.website && (
            <div className="text-sm">
              <span className="font-medium">Website:</span>{" "}
              <a
                href={token.analysis.social.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Visitar
              </a>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
