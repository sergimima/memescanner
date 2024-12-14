import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Header } from '@/components/layout/header'
import { Web3Provider } from '@/components/providers/web3-provider'
import { NetworkProvider } from '@/features/network/network-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MemeScanner',
  description: 'Early Memecoin Detection Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <Web3Provider>
            <NetworkProvider>
              <div className="relative flex min-h-screen flex-col">
                <Header />
                <main className="flex-1">{children}</main>
              </div>
            </NetworkProvider>
          </Web3Provider>
        </ThemeProvider>
      </body>
    </html>
  )
}
