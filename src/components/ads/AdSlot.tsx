'use client'
import { useAdProvider } from './AdProvider'
import { resolveAdPlacement, type AdPlacement } from '@/services/ads/adConfig'

type Props = { placement: AdPlacement; fallbackPlacement?: AdPlacement; className?: string }

export const AdSlot = ({ placement, fallbackPlacement, className }: Props) => {
  const { renderSlot } = useAdProvider()
  // Tenants that haven't configured this placement still get an ad (the
  // fallback placement's unit) instead of nothing, AdSense only. See BLO-133
  // and resolveAdPlacement.
  return <>{renderSlot(resolveAdPlacement(placement, fallbackPlacement), className)}</>
}
