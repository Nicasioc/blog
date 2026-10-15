'use client'
import { useEffect, useId } from 'react'
import { AD_PLACEMENTS, getGamAdUnitPath, type AdPlacement } from '@/services/ads/adConfig'
import { buildGptDivId, displayGptSlot, setGptPersonalization } from '@/services/ads/gpt'
import { getReservedAdDimensions } from '@/domain/ads/adSize.utils'
import { buildGamSizeMapping } from '@/domain/ads/gamSizeMapping.utils'
import type { AdPersonalization } from '@/domain/consent/adPersonalization'
import { cn } from '@/lib/utils'

type Props = { placement: AdPlacement; className?: string; personalization: AdPersonalization }

export const GamSlot = ({ placement, className, personalization }: Props) => {
  const divId = buildGptDivId(placement, useId())
  const adUnitPath = getGamAdUnitPath(placement)
  const { sizes } = AD_PLACEMENTS[placement]

  // Declared before the slot effect so the privacy setting is queued ahead of
  // the first define/fetch. Re-runs when consent corrects from the SSR null
  // snapshot to the stored value after hydration — same reason AdSenseSlot
  // keeps its flag in sync instead of capturing it once (BLO-193).
  useEffect(() => {
    if (!adUnitPath) return
    setGptPersonalization(personalization)
  }, [adUnitPath, personalization])

  useEffect(() => {
    if (!adUnitPath) return
    return displayGptSlot({ adUnitPath, sizes, sizeMapping: buildGamSizeMapping(sizes), divId })
  }, [adUnitPath, sizes, divId])

  if (!adUnitPath) return null

  const reserved = getReservedAdDimensions(sizes)

  return (
    // w-full: without it the div collapses to 0px inside Header/Footer's
    // `flex justify-center` and the size mapping picks nothing (BLO-191).
    // minHeight/maxWidth reserve space before the creative loads (BLO-134).
    <div
      id={divId}
      className={cn('w-full', className)}
      style={
        reserved
          ? { minHeight: reserved.minHeightPx, maxWidth: reserved.maxWidthPx, marginInline: 'auto' }
          : undefined
      }
    />
  )
}
