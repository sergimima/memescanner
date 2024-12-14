import { TokenCard } from "@/components/ui/token-card"
import Link from "next/link"

const exampleTokens = [
  {
    id: "1",
    name: "Example Token 1",
    score: 85,
    liquidity: 50000,
    holders: 1200,
  },
  {
    id: "2",
    name: "Example Token 2",
    score: 92,
    liquidity: 75000,
    holders: 2500,
  },
  {
    id: "3",
    name: "Example Token 3",
    score: 78,
    liquidity: 25000,
    holders: 800,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold mb-8">MemeScanner</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exampleTokens.map((token) => (
            <Link key={token.id} href={`/token/${token.id}`} className="transition-transform hover:scale-105">
              <TokenCard 
                name={token.name}
                score={token.score}
                liquidity={token.liquidity}
                holders={token.holders}
              />
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
