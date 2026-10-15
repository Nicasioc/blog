import { describe, it, expect, vi } from 'vitest'
import { isElementRendered } from './dom'

const rects = (count: number) => ({ length: count }) as DOMRectList

describe('isElementRendered', () => {
  it('returns true when the element has a layout box', () => {
    const element = document.createElement('div')
    vi.spyOn(element, 'getClientRects').mockReturnValue(rects(1))
    expect(isElementRendered(element)).toBe(true)
  })

  it('returns false when the element (or an ancestor) is display:none', () => {
    const element = document.createElement('div')
    vi.spyOn(element, 'getClientRects').mockReturnValue(rects(0))
    expect(isElementRendered(element)).toBe(false)
  })
})
