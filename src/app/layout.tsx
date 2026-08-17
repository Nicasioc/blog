import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { siteConfig } from '@/lib/siteConfig'
import { serverEnv } from '@/lib/env.server'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Providers } from './providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: {
    default: siteConfig.siteName,
    template: `%s | ${siteConfig.siteName}`,
  },
  description: `${siteConfig.siteName} — últimas noticias y novedades`,
  robots: { index: true, follow: true },
  icons: {
    icon: serverEnv.SITE_FAVICON_URL ?? '/favicon.ico',
    apple: serverEnv.SITE_APPLE_TOUCH_ICON_URL,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.className}>
      <head>
        <style>{`
          :root {
            --brand-primary: ${siteConfig.theme.primary};
            --brand-secondary: ${siteConfig.theme.secondary};
            --brand-primary-foreground: ${siteConfig.theme.primaryForeground};
          }
        `}</style>
      </head>
      <body>
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
        {siteConfig.adProvider === 'adsense' && siteConfig.adSensePublisherId && (
          <Script
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${siteConfig.adSensePublisherId}`}
            strategy="afterInteractive"
            crossOrigin="anonymous"
          />
        )}
      </body>
    </html>
  )
}
