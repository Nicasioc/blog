'use client'
import { useAdProvider } from './AdProvider'
import { isAdPlacementConfigured, type AdPlacement } from '@/services/ads/adConfig'

type Props = { placement: AdPlacement; fallbackPlacement?: AdPlacement; className?: string }

export const AdSlot = ({ placement, fallbackPlacement, className }: Props) => {
  const { renderSlot } = useAdProvider()
  // Tenants that haven't configured this placement for the active provider
  // still get an ad (the fallback placement's unit) instead of nothing. See
  // BLO-133.
  const effectivePlacement =
    !isAdPlacementConfigured(placement) && fallbackPlacement ? fallbackPlacement : placement
  return <>{renderSlot(effectivePlacement, className)}</>
}
