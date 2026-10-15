import type { ComponentProps } from 'react'
import { getReservedAdDimensions } from '@/domain/ads/adSize.utils'
import { cn } from '@/lib/utils'

type Props = ComponentProps<'div'> & { sizes: Array<[number, number]> }

// Shared wrapper for every provider's slot. w-full so it spans its flex-item
// context (Header/Footer use `flex justify-center`) instead of shrinking to
// zero — providers measure this width to pick a size (BLO-191).
// minHeight/maxWidth reserve space before the creative loads (BLO-134).
export const ReservedAdContainer = ({ sizes, className, style, ...rest }: Props) => {
  const reserved = getReservedAdDimensions(sizes)

  return (
    <div
      className={cn('w-full', className)}
      style={
        reserved
          ? {
              ...style,
              minHeight: reserved.minHeightPx,
              maxWidth: reserved.maxWidthPx,
              marginInline: 'auto',
            }
          : style
      }
      {...rest}
    />
  )
}
