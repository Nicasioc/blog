import { siteConfig } from '@/lib/siteConfig'
import { isNil, isNonEmptyString } from '@/utils/checks'

export type AdPlacement =
  | 'header-leaderboard'
  | 'in-content'
  | 'sidebar'
  | 'footer'
  | 'mobile-banner'
  | 'in-feed'
  | 'below-content'

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
  'below-content': {
    placement: 'below-content',
    sizes: [
      [336, 280],
      [300, 250],
      [728, 90],
    ],
    adUnitId: siteConfig.ads.slots['below-content'],
  },
}

export const getGamAdUnitPath = (placement: AdPlacement): string | undefined => {
  const { gamNetworkCode, gamSlots } = siteConfig.ads
  const slot = gamSlots[placement]

  if (!isNonEmptyString(gamNetworkCode) || !isNonEmptyString(slot)) return undefined

  return `/${gamNetworkCode}/${slot}`
}

// Whether the active provider has an ad unit for this placement. AdSlot's
// fallback (BLO-133) must ask the active provider — checking the AdSense slot
// id under provider=gam made mobile-banner always fall back to the
// leaderboard, whose GAM mobile size bucket is empty (BLO-140).
export const isAdPlacementConfigured = (placement: AdPlacement): boolean => {
  switch (siteConfig.ads.provider) {
    case 'adsense':
      return isNonEmptyString(AD_PLACEMENTS[placement].adUnitId)
    case 'gam':
      return !isNil(getGamAdUnitPath(placement))
    default:
      return false
  }
}

// AdSlot's fallback (BLO-133) only makes sense for AdSense, whose responsive
// units adapt to any width. GAM's fallbacks are the desktop leaderboards,
// whose mobile size bucket is empty by design (BLO-138) — falling back would
// render a blank reserved box on phones, so under GAM an unconfigured
// placement just renders nothing.
export const resolveAdPlacement = (
  placement: AdPlacement,
  fallbackPlacement?: AdPlacement,
): AdPlacement => {
  if (isNil(fallbackPlacement) || isAdPlacementConfigured(placement)) return placement
  return siteConfig.ads.provider === 'adsense' ? fallbackPlacement : placement
}
