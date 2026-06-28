import type { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/siteConfig'
import { serverEnv } from '@/lib/env.server'
import { buildSiteManifest } from '@/domain/seo/manifest.utils'

export default function manifest(): MetadataRoute.Manifest {
  return buildSiteManifest({
    siteName: siteConfig.siteName,
    themeColor: siteConfig.theme.primary,
    icon192Url: serverEnv.SITE_ICON_192_URL,
    icon512Url: serverEnv.SITE_ICON_512_URL,
  })
}
