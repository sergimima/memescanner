'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TokenBase } from "../types/token"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface TokenCardProps {
  token: TokenBase
  onAnalyze?: () => void
}

export function TokenCard({ token, onAnalyze }: TokenCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{token.name}</CardTitle>
            <CardDescription>{token.symbol}</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">
              Score: {token.score.total}/100
            </div>
            <div className="text-xs text-muted-foreground">
              {formatDistanceToNow(token.createdAt, { addSuffix: true, locale: es })}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
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
      </CardContent>
      <CardFooter>
        <div className="w-full space-y-2">
          <div className="text-sm">
            <span className="font-medium">Supply Total:</span>{" "}
            {Number(token.totalSupply).toLocaleString()}
          </div>
          {token.analysis.social?.telegram && (
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
        </div>
      </CardFooter>
    </Card>
  )
}
