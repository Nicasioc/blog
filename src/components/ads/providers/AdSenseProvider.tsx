'use client'
import { useEffect } from 'react'
import { siteConfig } from '@/lib/siteConfig'
import { AD_PLACEMENTS, type AdPlacement } from '@/services/ads/adConfig'

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

  if (!config.adUnitId || !siteConfig.adSensePublisherId) return null

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={siteConfig.adSensePublisherId}
        data-ad-slot={config.adUnitId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  )
}
