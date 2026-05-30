import { clientEnv } from '@/lib/env'

export type AdPlacement = 'header-leaderboard' | 'in-content' | 'sidebar' | 'footer'

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
    ],
    adUnitId: clientEnv.NEXT_PUBLIC_ADSENSE_SLOT_HEADER,
  },
  'in-content': {
    placement: 'in-content',
    sizes: [
      [300, 250],
      [336, 280],
    ],
    adUnitId: clientEnv.NEXT_PUBLIC_ADSENSE_SLOT_IN_CONTENT,
  },
  sidebar: {
    placement: 'sidebar',
    sizes: [
      [300, 250],
      [300, 600],
    ],
    adUnitId: clientEnv.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR,
  },
  footer: {
    placement: 'footer',
    sizes: [
      [728, 90],
      [970, 90],
    ],
    adUnitId: clientEnv.NEXT_PUBLIC_ADSENSE_SLOT_FOOTER,
  },
}
