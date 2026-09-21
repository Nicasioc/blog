'use client'
import Script from 'next/script'
import { siteConfig } from '@/lib/siteConfig'

// Loads for every visitor once provider/publisher/ads.enabled allow it —
// consent no longer gates the script itself, only ad personalization
// (see AdSenseProvider.tsx / getAdPersonalization). See BLO-193.
export const AdSenseScript = () => {
  if (!siteConfig.ads.enabled) return null
  if (siteConfig.ads.provider !== 'adsense' || !siteConfig.ads.adSensePublisherId) return null

  return (
    <Script
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${siteConfig.ads.adSensePublisherId}`}
      strategy="afterInteractive"
      crossOrigin="anonymous"
    />
  )
}
