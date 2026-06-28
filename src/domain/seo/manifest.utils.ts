import type { MetadataRoute } from 'next'

export type SiteManifestConfig = {
  siteName: string
  themeColor: string
  icon192Url?: string
  icon512Url?: string
}

export function buildSiteManifest(config: SiteManifestConfig): MetadataRoute.Manifest {
  const icons: NonNullable<MetadataRoute.Manifest['icons']> = []

  if (config.icon192Url) {
    icons.push({ src: config.icon192Url, sizes: '192x192', type: 'image/png' })
  }
  if (config.icon512Url) {
    icons.push({ src: config.icon512Url, sizes: '512x512', type: 'image/png' })
  }

  return {
    name: config.siteName,
    short_name: config.siteName,
    description: `${config.siteName} — latest news and updates`,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: config.themeColor,
    icons,
  }
}
