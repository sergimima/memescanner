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
    <main className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 dark:from-purple-950 dark:via-gray-900 dark:to-blue-950">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-transparent dark:bg-gradient-to-r dark:from-white dark:to-gray-300 dark:bg-clip-text">
          MemeScanner
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exampleTokens.map((token) => (
            <Link 
              key={token.id} 
              href={`/token/${token.id}`} 
              className="transform transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
            >
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
