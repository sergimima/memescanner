'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  {
    name: 'Dashboard',
    href: '/',
  },
  {
    name: 'Tokens',
    href: '/tokens',
  },
  {
    name: 'Watchlist',
    href: '/watchlist',
  },
  {
    name: 'Analytics',
    href: '/analytics',
  },
]

export function NavMenu() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center space-x-6">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary',
            pathname === item.href
              ? 'text-foreground'
              : 'text-foreground/60'
          )}
        >
          {item.name}
        </Link>
      ))}
    </nav>
  )
}
