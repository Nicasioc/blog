'use client'
// Stub — implement when adding header bidding (GAM + Prebid.js).
// Flip NEXT_PUBLIC_AD_PROVIDER=prebid and add implementation here.
// AdSlot interface stays unchanged.
import { AD_PLACEMENTS, type AdPlacement } from '@/services/ads/adConfig'
import { getReservedAdDimensions } from '@/domain/ads/adSize.utils'
import { cn } from '@/lib/utils'

type Props = { placement: AdPlacement; className?: string }

// w-full mirrors AdSenseProvider's fix (BLO-191) so the future GAM slot
// inherits a measurable width inside flex-item contexts (Header/Footer).
// Reserved minHeight/maxWidth mirrors AdSenseProvider's CLS fix (BLO-134).
export const PrebidSlot = ({ placement, className }: Props) => {
  const reserved = getReservedAdDimensions(AD_PLACEMENTS[placement].sizes)

  return (
    <div
      className={cn('w-full', className)}
      style={
        reserved
          ? { minHeight: reserved.minHeightPx, maxWidth: reserved.maxWidthPx, marginInline: 'auto' }
          : undefined
      }
      data-placement={placement}
    />
  )
}
