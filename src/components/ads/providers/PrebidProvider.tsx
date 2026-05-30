'use client'
// Stub — implement when adding header bidding (GAM + Prebid.js).
// Flip NEXT_PUBLIC_AD_PROVIDER=prebid and add implementation here.
// AdSlot interface stays unchanged.
import type { AdPlacement } from '@/services/ads/adConfig'

type Props = { placement: AdPlacement; className?: string }

export const PrebidSlot = ({ placement, className }: Props) => (
  <div className={className} data-placement={placement} />
)
