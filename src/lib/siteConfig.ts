import { clientEnv } from '@/lib/env.client'
import type { AdPlacement } from '@/services/ads/adConfig'

export type SiteConfig = {
  siteName: string
  siteUrl: string
  logoUrl: string
  contactEmail: string
  theme: {
    primary: string
    secondary: string
    primaryForeground: string
  }
  ads: {
    provider: 'adsense' | 'gam' | 'prebid'
    adSensePublisherId: string | undefined
    slots: Record<AdPlacement, string>
  }
}

export const siteConfig: SiteConfig = {
  siteName: clientEnv.NEXT_PUBLIC_SITE_NAME,
  // Canonical URLs, the sitemap and metadataBase all build on this, so keep it
  // free of a trailing slash regardless of how the env var is set.
  siteUrl: clientEnv.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, ''),
  logoUrl: clientEnv.NEXT_PUBLIC_SITE_LOGO_URL,
  contactEmail: clientEnv.NEXT_PUBLIC_CONTACT_EMAIL,
  theme: {
    primary: clientEnv.NEXT_PUBLIC_PRIMARY_COLOR,
    secondary: clientEnv.NEXT_PUBLIC_SECONDARY_COLOR,
    primaryForeground: clientEnv.NEXT_PUBLIC_PRIMARY_FOREGROUND,
  },
  ads: {
    provider: clientEnv.NEXT_PUBLIC_AD_PROVIDER,
    adSensePublisherId: clientEnv.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID,
    slots: {
      'header-leaderboard': clientEnv.NEXT_PUBLIC_ADSENSE_SLOT_HEADER,
      'in-content': clientEnv.NEXT_PUBLIC_ADSENSE_SLOT_IN_CONTENT,
      sidebar: clientEnv.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR,
      footer: clientEnv.NEXT_PUBLIC_ADSENSE_SLOT_FOOTER,
      'mobile-banner': clientEnv.NEXT_PUBLIC_ADSENSE_SLOT_MOBILE_BANNER,
      'in-feed': clientEnv.NEXT_PUBLIC_ADSENSE_SLOT_IN_FEED,
    },
  },
}
