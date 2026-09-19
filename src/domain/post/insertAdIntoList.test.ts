import { describe, it, expect } from 'vitest'
import { insertAdMarker, isAdMarker, AD_MARKER } from './insertAdIntoList'

describe('insertAdMarker', () => {
  it('inserts the marker right after the item at afterIndex', () => {
    const result = insertAdMarker(['a', 'b', 'c', 'd'], 2)
    expect(result).toEqual(['a', 'b', 'c', AD_MARKER, 'd'])
  })

  it('inserts at the end when afterIndex is the last item', () => {
    const result = insertAdMarker(['a', 'b', 'c'], 2)
    expect(result).toEqual(['a', 'b', 'c', AD_MARKER])
  })

  it('returns a new array without mutating the input', () => {
    const items = ['a', 'b', 'c', 'd']
    const result = insertAdMarker(items, 1)
    expect(items).toEqual(['a', 'b', 'c', 'd'])
    expect(result).not.toBe(items)
  })

  it('is a no-op (copy, no marker) when the list is too short', () => {
    const items = ['a', 'b']
    const result = insertAdMarker(items, 2)
    expect(result).toEqual(['a', 'b'])
    expect(result).not.toBe(items)
  })

  it('is a no-op on an empty list', () => {
    expect(insertAdMarker([], 0)).toEqual([])
  })
})

describe('isAdMarker', () => {
  it('identifies the ad marker', () => {
    expect(isAdMarker(AD_MARKER)).toBe(true)
  })

  it('rejects arbitrary values', () => {
    expect(isAdMarker('a')).toBe(false)
    expect(isAdMarker(null)).toBe(false)
    expect(isAdMarker(undefined)).toBe(false)
    expect(isAdMarker({ id: 1 })).toBe(false)
  })
})
