import { describe, it, expect } from 'vitest'
import { buildGamSizeMapping } from './gamSizeMapping.utils'

describe('buildGamSizeMapping', () => {
  it('returns one entry per breakpoint, in ascending viewport order', () => {
    const mapping = buildGamSizeMapping([[300, 250]])
    expect(mapping.map(([viewport]) => viewport)).toEqual([
      [0, 0],
      [768, 0],
      [1024, 0],
    ])
  })

  it('places a mobile-safe rectangle size in every bucket (cumulative eligibility)', () => {
    const mapping = buildGamSizeMapping([[300, 250]])
    for (const [, sizes] of mapping) {
      expect(sizes).toEqual([[300, 250]])
    }
  })

  it('includes 336x280 in the mobile bucket (the exact width the 368px eligibility floor is chosen for)', () => {
    const [[, mobileSizes]] = buildGamSizeMapping([[336, 280]])
    expect(mobileSizes).toEqual([[336, 280]])
  })

  it('excludes a leaderboard size from the mobile bucket but includes it from tablet up', () => {
    const [[, mobileSizes], [, tabletSizes], [, desktopSizes]] = buildGamSizeMapping([[728, 90]])
    expect(mobileSizes).toEqual([])
    expect(tabletSizes).toEqual([[728, 90]])
    expect(desktopSizes).toEqual([[728, 90]])
  })

  it('includes a billboard size only from the desktop bucket', () => {
    const [[, mobileSizes], [, tabletSizes], [, desktopSizes]] = buildGamSizeMapping([[970, 250]])
    expect(mobileSizes).toEqual([])
    expect(tabletSizes).toEqual([])
    expect(desktopSizes).toEqual([[970, 250]])
  })

  it('excludes a size that fits no bucket at any breakpoint', () => {
    const mapping = buildGamSizeMapping([[1200, 600]])
    for (const [, sizes] of mapping) {
      expect(sizes).toEqual([])
    }
  })

  it('returns three empty-size buckets for empty input, without throwing', () => {
    const mapping = buildGamSizeMapping([])
    expect(mapping).toHaveLength(3)
    for (const [, sizes] of mapping) {
      expect(sizes).toEqual([])
    }
  })

  it('only includes sizes actually present in the input, per bucket', () => {
    const [, , [, desktopSizes]] = buildGamSizeMapping([
      [300, 250],
      [970, 250],
    ])
    expect(desktopSizes).toEqual([
      [300, 250],
      [970, 250],
    ])
  })

  // Per-placement checks against AD_PLACEMENTS' actual configured sizes
  // (src/services/ads/adConfig.ts), inlined here rather than imported so
  // this pure domain test needs no siteConfig mock. The ticket's audit note
  // says "each placement ... yields a non-empty mobile bucket" — true for
  // every placement whose sizes include a rectangle/mobile-banner width, but
  // not for header-leaderboard/footer: those are desktop-leaderboard-only by
  // design (mobile-banner is the separate placement/component swap that
  // covers small viewports for those two slots), so an empty mobile bucket
  // there is correct, not a bug.
  describe('AD_PLACEMENTS sizes (src/services/ads/adConfig.ts)', () => {
    it('mobile-banner (320x50, 320x100) — non-empty mobile bucket', () => {
      const [[, mobileSizes]] = buildGamSizeMapping([
        [320, 50],
        [320, 100],
      ])
      expect(mobileSizes).toEqual([
        [320, 50],
        [320, 100],
      ])
    })

    it('in-content / in-feed (300x250, 336x280) — non-empty mobile bucket', () => {
      const [[, mobileSizes]] = buildGamSizeMapping([
        [300, 250],
        [336, 280],
      ])
      expect(mobileSizes).toEqual([
        [300, 250],
        [336, 280],
      ])
    })

    it('sidebar (300x250, 300x600, 160x600) — non-empty mobile bucket', () => {
      const [[, mobileSizes]] = buildGamSizeMapping([
        [300, 250],
        [300, 600],
        [160, 600],
      ])
      expect(mobileSizes).toEqual([
        [300, 250],
        [300, 600],
        [160, 600],
      ])
    })

    it('below-content (336x280, 300x250, 728x90) — non-empty mobile bucket', () => {
      const [[, mobileSizes]] = buildGamSizeMapping([
        [336, 280],
        [300, 250],
        [728, 90],
      ])
      expect(mobileSizes).toEqual([
        [336, 280],
        [300, 250],
      ])
    })

    it('header-leaderboard / footer (728x90, 970x90, 970x250) — empty mobile bucket by design', () => {
      const [[, mobileSizes]] = buildGamSizeMapping([
        [728, 90],
        [970, 90],
        [970, 250],
      ])
      expect(mobileSizes).toEqual([])
    })
  })
})
