import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/layout/navbar'

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
      <body className="min-h-screen bg-background text-foreground">
        <Navbar />
        {children}
      </body>
    </html>
  )
}
