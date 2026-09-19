import { describe, it, expect, beforeEach, vi } from 'vitest'

// env.client.ts throws on import if any required var is missing, so every
// test here must stub the full required set before a fresh dynamic import —
// vi.mock isn't an option since the point is to exercise real env parsing.
const REQUIRED_ENV = {
  NEXT_PUBLIC_SITE_NAME: 'Test Site',
  NEXT_PUBLIC_SITE_URL: 'https://example.com',
  NEXT_PUBLIC_SITE_LOGO_URL: '/logo.svg',
  NEXT_PUBLIC_CONTACT_EMAIL: 'hola@example.com',
  NEXT_PUBLIC_PRIMARY_COLOR: '#111111',
  NEXT_PUBLIC_SECONDARY_COLOR: '#222222',
}

const stubRequiredEnv = () => {
  for (const [key, value] of Object.entries(REQUIRED_ENV)) {
    vi.stubEnv(key, value)
  }
}

describe('siteConfig.ads', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('defaults provider to adsense when NEXT_PUBLIC_AD_PROVIDER is unset', async () => {
    stubRequiredEnv()
    const { siteConfig } = await import('@/lib/siteConfig')
    expect(siteConfig.ads.provider).toBe('adsense')
  })

  it('reads provider from NEXT_PUBLIC_AD_PROVIDER when set', async () => {
    stubRequiredEnv()
    vi.stubEnv('NEXT_PUBLIC_AD_PROVIDER', 'gam')
    const { siteConfig } = await import('@/lib/siteConfig')
    expect(siteConfig.ads.provider).toBe('gam')
  })

  it('leaves adSensePublisherId undefined when unset', async () => {
    stubRequiredEnv()
    const { siteConfig } = await import('@/lib/siteConfig')
    expect(siteConfig.ads.adSensePublisherId).toBeUndefined()
  })

  it('reads adSensePublisherId from NEXT_PUBLIC_ADSENSE_PUBLISHER_ID when set', async () => {
    stubRequiredEnv()
    vi.stubEnv('NEXT_PUBLIC_ADSENSE_PUBLISHER_ID', 'ca-pub-1234567890123456')
    const { siteConfig } = await import('@/lib/siteConfig')
    expect(siteConfig.ads.adSensePublisherId).toBe('ca-pub-1234567890123456')
  })

  it('populates slots for every AdPlacement from the matching env var', async () => {
    stubRequiredEnv()
    vi.stubEnv('NEXT_PUBLIC_ADSENSE_SLOT_HEADER', 'slot-header')
    vi.stubEnv('NEXT_PUBLIC_ADSENSE_SLOT_IN_CONTENT', 'slot-in-content')
    vi.stubEnv('NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR', 'slot-sidebar')
    vi.stubEnv('NEXT_PUBLIC_ADSENSE_SLOT_FOOTER', 'slot-footer')
    vi.stubEnv('NEXT_PUBLIC_ADSENSE_SLOT_MOBILE_BANNER', 'slot-mobile-banner')
    vi.stubEnv('NEXT_PUBLIC_ADSENSE_SLOT_IN_FEED', 'slot-in-feed')

    const { siteConfig } = await import('@/lib/siteConfig')

    expect(siteConfig.ads.slots).toEqual({
      'header-leaderboard': 'slot-header',
      'in-content': 'slot-in-content',
      sidebar: 'slot-sidebar',
      footer: 'slot-footer',
      'mobile-banner': 'slot-mobile-banner',
      'in-feed': 'slot-in-feed',
    })
  })

  it('defaults every slot to an empty string when unset', async () => {
    stubRequiredEnv()
    const { siteConfig } = await import('@/lib/siteConfig')
    expect(siteConfig.ads.slots).toEqual({
      'header-leaderboard': '',
      'in-content': '',
      sidebar: '',
      footer: '',
      'mobile-banner': '',
      'in-feed': '',
    })
  })
})
