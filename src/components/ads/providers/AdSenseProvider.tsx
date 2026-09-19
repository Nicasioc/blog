'use client'
import { useEffect } from 'react'
import { siteConfig } from '@/lib/siteConfig'
import { AD_PLACEMENTS, type AdPlacement } from '@/services/ads/adConfig'
import { getReservedAdDimensions } from '@/domain/ads/adSize.utils'
import { cn } from '@/lib/utils'

type Props = { placement: AdPlacement; className?: string }

export const AdSenseSlot = ({ placement, className }: Props) => {
  const config = AD_PLACEMENTS[placement]

  useEffect(() => {
    try {
      ;(window as { adsbygoogle?: unknown[] }).adsbygoogle =
        (window as { adsbygoogle?: unknown[] }).adsbygoogle ?? []
      ;((window as { adsbygoogle?: unknown[] }).adsbygoogle as unknown[]).push({})
    } catch {
      // adsbygoogle not yet loaded — script fires push() when ready
    }
  }, [])

  if (!config.adUnitId || !siteConfig.ads.adSensePublisherId) return null

  const reserved = getReservedAdDimensions(config.sizes)

  return (
    // w-full so the wrapper spans its flex-item context (Header/Footer use
    // `flex justify-center`) instead of shrinking to zero — a responsive
    // `data-ad-format="auto"` unit otherwise measures availableWidth=0 and
    // AdSense never attempts a fill. See BLO-191. minHeight/maxWidth reserve
    // space before the creative loads to reduce CLS — see BLO-134.
    <div
      className={cn('w-full', className)}
      style={
        reserved
          ? { minHeight: reserved.minHeightPx, maxWidth: reserved.maxWidthPx, marginInline: 'auto' }
          : undefined
      }
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={siteConfig.ads.adSensePublisherId}
        data-ad-slot={config.adUnitId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  )
}
