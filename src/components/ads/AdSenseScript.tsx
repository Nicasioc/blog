'use client'
import Script from 'next/script'
import { siteConfig } from '@/lib/siteConfig'
import { useConsent } from '@/components/consent/ConsentContext'

export const AdSenseScript = () => {
  const { status } = useConsent()

  if (status !== 'accepted') return null
  if (siteConfig.adProvider !== 'adsense' || !siteConfig.adSensePublisherId) return null

  return (
    <Script
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${siteConfig.adSensePublisherId}`}
      strategy="afterInteractive"
      crossOrigin="anonymous"
    />
  )
}
