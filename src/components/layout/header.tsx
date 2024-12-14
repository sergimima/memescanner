'use client'

import * as React from 'react'
import Link from 'next/link'
import { NetworkSelector } from '@/components/network-selector'
import { NetworkId } from '@/config/networks'

export function Header() {
  const [network, setNetwork] = React.useState<NetworkId>('solana')

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">MemeScanner</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/trending"
              className="transition-colors hover:text-foreground/80"
            >
              Trending
            </Link>
            <Link
              href="/watchlist"
              className="transition-colors hover:text-foreground/80"
            >
              Watchlist
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex justify-end">
            <NetworkSelector value={network} onValueChange={setNetwork} />
          </div>
        </div>
      </div>
    </header>
  )
}
