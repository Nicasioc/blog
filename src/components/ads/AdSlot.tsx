'use client'
import { useAdProvider } from './AdProvider'
import type { AdPlacement } from '@/services/ads/adConfig'

type Props = { placement: AdPlacement; className?: string }

export const AdSlot = ({ placement, className }: Props) => {
  const { renderSlot } = useAdProvider()
  return <>{renderSlot(placement, className)}</>
}
