import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import { Providers } from '@/components/providers'
import '@/styles/main.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Base Fishing',
  description: 'The ultimate fishing experience on Base and Farcaster',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
