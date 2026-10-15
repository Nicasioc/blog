'use client'
import { useEffect, useId, useRef } from 'react'
import { AD_PLACEMENTS, getGamAdUnitPath, type AdPlacement } from '@/services/ads/adConfig'
import { buildGptDivId, displayGptSlot } from '@/services/ads/gpt'
import { buildGamSizeMapping } from '@/domain/ads/gamSizeMapping.utils'
import { isElementRendered } from '@/utils/dom'
import { isNil } from '@/utils/checks'
import { ReservedAdContainer } from '../ReservedAdContainer'

type Props = { placement: AdPlacement; className?: string }

// Personalization is page-level in GPT, so it's applied once by GamScript,
// not per slot.
export const GamSlot = ({ placement, className }: Props) => {
  const divId = buildGptDivId(placement, useId())
  const adUnitPath = getGamAdUnitPath(placement)
  const { sizes } = AD_PLACEMENTS[placement]
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (isNil(adUnitPath) || isNil(container)) return
    // Responsive swaps hide one of two slots with CSS (md:hidden / hidden
    // md:block). GPT's size mapping only looks at the viewport, so it would
    // happily fetch into a display:none div — skip those. A resize across a
    // breakpoint won't load the newly visible slot until the next mount;
    // viewport lazy-loading (BLO-144) replaces this check.
    if (!isElementRendered(container)) return
    return displayGptSlot({ adUnitPath, sizes, sizeMapping: buildGamSizeMapping(sizes), divId })
  }, [adUnitPath, sizes, divId])

  if (isNil(adUnitPath)) return null

  return <ReservedAdContainer ref={containerRef} id={divId} sizes={sizes} className={className} />
}
