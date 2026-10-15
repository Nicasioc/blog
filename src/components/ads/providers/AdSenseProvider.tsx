'use client'
import { useEffect, useRef } from 'react'
import { siteConfig } from '@/lib/siteConfig'
import { AD_PLACEMENTS, type AdPlacement } from '@/services/ads/adConfig'
import type { AdPersonalization } from '@/domain/consent/adPersonalization'
import { ReservedAdContainer } from '../ReservedAdContainer'

type Props = { placement: AdPlacement; className?: string; personalization: AdPersonalization }

export const AdSenseSlot = ({ placement, className, personalization }: Props) => {
  const config = AD_PLACEMENTS[placement]
  const hasPushed = useRef(false)

  // Keeps requestNonPersonalizedAds in sync with the latest personalization
  // on every change, but calls push() only once (hasPushed guard). This is
  // deliberately NOT "capture personalization once at mount": useConsent()
  // renders once with the SSR-safe null snapshot before correcting to the
  // real (localStorage) value right after hydration, so a mount-once read
  // of `personalization` would freeze the wrong, null-derived value for
  // every returning visitor, not just react to later, in-session consent
  // changes. Updating the flag on every change and pushing once is safe:
  // adsbygoogle.js loads async (afterInteractive) and doesn't drain the
  // queue until it's ready, by which point the flag has settled — the same
  // assumption the try/catch below already relies on. See BLO-193.
  useEffect(() => {
    try {
      const adsbygoogle = ((window as { adsbygoogle?: unknown[] }).adsbygoogle =
        (window as { adsbygoogle?: unknown[] }).adsbygoogle ?? [])
      ;(adsbygoogle as { requestNonPersonalizedAds?: number }).requestNonPersonalizedAds =
        personalization === 'non-personalized' ? 1 : 0

      if (!hasPushed.current) {
        hasPushed.current = true
        ;(adsbygoogle as unknown[]).push({})
      }
    } catch {
      // adsbygoogle not yet loaded — script fires push() when ready
    }
  }, [personalization])

  if (!config.adUnitId || !siteConfig.ads.adSensePublisherId) return null

  return (
    // ReservedAdContainer's w-full matters here: a responsive
    // `data-ad-format="auto"` unit in a zero-width wrapper measures
    // availableWidth=0 and AdSense never attempts a fill (BLO-191).
    <ReservedAdContainer sizes={config.sizes} className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={siteConfig.ads.adSensePublisherId}
        data-ad-slot={config.adUnitId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </ReservedAdContainer>
  )
}
