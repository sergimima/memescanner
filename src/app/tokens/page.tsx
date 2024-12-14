import { TokenList } from "@/features/tokens/components/token-list"

export default function TokensPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Nuevos Tokens</h1>
      <TokenList />
    </div>
  )
}
