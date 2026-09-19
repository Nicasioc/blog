export type ReservedAdDimensions = {
  minHeightPx: number
  maxWidthPx: number
}

// Conservative, not exact: a placement whose sizes vary in height (e.g.
// header-leaderboard's 90px leaderboard vs. 250px billboard) can still
// shift by the difference once a taller creative fills. See BLO-134.
export const getReservedAdDimensions = (
  sizes: Array<[number, number]>,
): ReservedAdDimensions | undefined => {
  if (sizes.length === 0) return undefined

  const heights = sizes.map(([, height]) => height)
  const widths = sizes.map(([width]) => width)

  return {
    minHeightPx: Math.min(...heights),
    maxWidthPx: Math.max(...widths),
  }
}
