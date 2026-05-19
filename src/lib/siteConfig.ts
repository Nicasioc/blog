import { clientEnv } from '@/lib/env'

export type SiteConfig = {
  siteName: string
  siteUrl: string
  logoUrl: string
  theme: {
    primary: string
    secondary: string
    primaryForeground: string
  }
  adProvider: 'adsense' | 'gam' | 'prebid'
  adSensePublisherId: string | undefined
}

export const siteConfig: SiteConfig = {
  siteName: clientEnv.NEXT_PUBLIC_SITE_NAME,
  siteUrl: clientEnv.NEXT_PUBLIC_SITE_URL,
  logoUrl: clientEnv.NEXT_PUBLIC_SITE_LOGO_URL,
  theme: {
    primary: clientEnv.NEXT_PUBLIC_PRIMARY_COLOR,
    secondary: clientEnv.NEXT_PUBLIC_SECONDARY_COLOR,
    primaryForeground: clientEnv.NEXT_PUBLIC_PRIMARY_FOREGROUND,
  },
  adProvider: clientEnv.NEXT_PUBLIC_AD_PROVIDER,
  adSensePublisherId: clientEnv.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID,
}
