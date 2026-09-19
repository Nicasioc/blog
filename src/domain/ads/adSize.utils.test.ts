import { describe, it, expect } from 'vitest'
import { getReservedAdDimensions } from './adSize.utils'

describe('getReservedAdDimensions', () => {
  it('returns undefined for an empty array', () => {
    expect(getReservedAdDimensions([])).toBeUndefined()
  })

  it('reserves the single size for a single-size list', () => {
    expect(getReservedAdDimensions([[300, 600]])).toEqual({
      minHeightPx: 600,
      maxWidthPx: 300,
    })
  })

  it('reserves the smallest height and largest width across a multi-size list', () => {
    expect(
      getReservedAdDimensions([
        [728, 90],
        [970, 90],
        [970, 250],
      ]),
    ).toEqual({ minHeightPx: 90, maxWidthPx: 970 })
  })

  it('is order-independent — unsorted input yields the same result', () => {
    expect(
      getReservedAdDimensions([
        [970, 250],
        [300, 90],
        [728, 600],
      ]),
    ).toEqual({ minHeightPx: 90, maxWidthPx: 970 })
  })
})
