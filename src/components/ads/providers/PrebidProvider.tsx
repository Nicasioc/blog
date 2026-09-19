'use client'
// Stub — implement when adding header bidding (GAM + Prebid.js).
// Flip NEXT_PUBLIC_AD_PROVIDER=prebid and add implementation here.
// AdSlot interface stays unchanged.
import type { AdPlacement } from '@/services/ads/adConfig'
import { cn } from '@/lib/utils'

type Props = { placement: AdPlacement; className?: string }

// w-full mirrors AdSenseProvider's fix (BLO-191) so the future GAM slot
// inherits a measurable width inside flex-item contexts (Header/Footer).
export const PrebidSlot = ({ placement, className }: Props) => (
  <div className={cn('w-full', className)} data-placement={placement} />
)
