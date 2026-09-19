import { siteConfig } from '@/lib/siteConfig'

export type AdPlacement =
  | 'header-leaderboard'
  | 'in-content'
  | 'sidebar'
  | 'footer'
  | 'mobile-banner'
  | 'in-feed'

export type AdSlotConfig = {
  placement: AdPlacement
  sizes: Array<[number, number]>
  adUnitId: string
}

export const AD_PLACEMENTS: Record<AdPlacement, AdSlotConfig> = {
  'header-leaderboard': {
    placement: 'header-leaderboard',
    sizes: [
      [728, 90],
      [970, 90],
      [970, 250],
    ],
    adUnitId: siteConfig.ads.slots['header-leaderboard'],
  },
  'in-content': {
    placement: 'in-content',
    sizes: [
      [300, 250],
      [336, 280],
    ],
    adUnitId: siteConfig.ads.slots['in-content'],
  },
  sidebar: {
    placement: 'sidebar',
    sizes: [
      [300, 250],
      [300, 600],
      [160, 600],
    ],
    adUnitId: siteConfig.ads.slots.sidebar,
  },
  footer: {
    placement: 'footer',
    sizes: [
      [728, 90],
      [970, 90],
      [970, 250],
    ],
    adUnitId: siteConfig.ads.slots.footer,
  },
  'mobile-banner': {
    placement: 'mobile-banner',
    sizes: [
      [320, 50],
      [320, 100],
    ],
    adUnitId: siteConfig.ads.slots['mobile-banner'],
  },
  'in-feed': {
    placement: 'in-feed',
    sizes: [
      [300, 250],
      [336, 280],
    ],
    adUnitId: siteConfig.ads.slots['in-feed'],
  },
}
