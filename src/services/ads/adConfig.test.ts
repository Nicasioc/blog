import { describe, it, expect, vi } from 'vitest'

// AD_PLACEMENTS is computed at module-eval time from siteConfig.ads.slots, so
// siteConfig must be mocked (not stubEnv'd) before adConfig is imported —
// matches the repo's existing convention (see src/app/sitemap.test.ts) and
// avoids the real clientEnv parse, which throws without the full required
// env var set under Vitest.
vi.mock('@/lib/siteConfig', () => ({
  siteConfig: {
    ads: {
      provider: 'adsense',
      adSensePublisherId: 'ca-pub-1234567890123456',
      slots: {
        'header-leaderboard': 'slot-header',
        'in-content': 'slot-in-content',
        sidebar: 'slot-sidebar',
        footer: 'slot-footer',
        'mobile-banner': 'slot-mobile-banner',
        'in-feed': 'slot-in-feed',
        'below-content': 'slot-below-content',
      },
    },
  },
}))

const { AD_PLACEMENTS } = await import('@/services/ads/adConfig')

describe('AD_PLACEMENTS', () => {
  it('keys every entry by its own placement', () => {
    for (const [key, config] of Object.entries(AD_PLACEMENTS)) {
      expect(config.placement).toBe(key)
    }
  })

  it('resolves adUnitId from siteConfig.ads.slots for every placement', () => {
    expect(AD_PLACEMENTS['header-leaderboard'].adUnitId).toBe('slot-header')
    expect(AD_PLACEMENTS['in-content'].adUnitId).toBe('slot-in-content')
    expect(AD_PLACEMENTS.sidebar.adUnitId).toBe('slot-sidebar')
    expect(AD_PLACEMENTS.footer.adUnitId).toBe('slot-footer')
    expect(AD_PLACEMENTS['mobile-banner'].adUnitId).toBe('slot-mobile-banner')
    expect(AD_PLACEMENTS['in-feed'].adUnitId).toBe('slot-in-feed')
    expect(AD_PLACEMENTS['below-content'].adUnitId).toBe('slot-below-content')
  })

  it('gives every placement at least one configured size', () => {
    for (const config of Object.values(AD_PLACEMENTS)) {
      expect(config.sizes.length).toBeGreaterThan(0)
    }
  })

  it('configures mobile-banner with the IAB mobile sizes (BLO-133)', () => {
    expect(AD_PLACEMENTS['mobile-banner'].sizes).toEqual([
      [320, 50],
      [320, 100],
    ])
  })

  it('configures in-feed with rectangle sizes matching in-content (BLO-189)', () => {
    expect(AD_PLACEMENTS['in-feed'].sizes).toEqual([
      [300, 250],
      [336, 280],
    ])
  })

  it('configures below-content with rectangle and leaderboard sizes (BLO-190)', () => {
    expect(AD_PLACEMENTS['below-content'].sizes).toEqual([
      [336, 280],
      [300, 250],
      [728, 90],
    ])
  })
})
