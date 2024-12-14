'use client'

import * as React from 'react'
import Link from 'next/link'
import { NetworkSelector } from '@/components/network-selector'
import { NetworkId } from '@/config/networks'
import { ThemeToggle } from '@/components/theme-toggle'
import { ConnectButton } from '@/components/wallet/connect-button'

export function Header() {
  const [network, setNetwork] = React.useState<NetworkId>('solana')

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-white/80 dark:bg-gray-900/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2 font-bold">
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 text-transparent bg-clip-text">
              MemeScanner
            </span>
          </Link>
          <NetworkSelector value={network} onValueChange={setNetwork} />
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-4">
            <ThemeToggle />
            <ConnectButton />
          </nav>
        </div>
      </div>
    </header>
  )
}
