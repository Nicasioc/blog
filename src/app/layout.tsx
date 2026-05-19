import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { siteConfig } from '@/lib/siteConfig'
import './globals.css'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: {
    default: siteConfig.siteName,
    template: `%s | ${siteConfig.siteName}`,
  },
  metadataBase: new URL(siteConfig.siteUrl),
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        <style>{`
          :root {
            --brand-primary: ${siteConfig.theme.primary};
            --brand-secondary: ${siteConfig.theme.secondary};
            --brand-primary-foreground: ${siteConfig.theme.primaryForeground};
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}
