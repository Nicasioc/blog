import { describe, it, expect } from 'vitest'
import { formatPostCount } from '@/domain/post/postCount.utils'

describe('formatPostCount', () => {
  it('uses the singular noun for exactly one', () => {
    expect(formatPostCount(1)).toBe('1 artículo')
  })

  it('uses the plural noun for zero and many', () => {
    expect(formatPostCount(0)).toBe('0 artículos')
    expect(formatPostCount(42)).toBe('42 artículos')
  })

  it('floors fractional counts', () => {
    expect(formatPostCount(3.7)).toBe('3 artículos')
  })

  it.each([-1, NaN, Infinity])('clamps unusable input %o to zero', (input) => {
    expect(formatPostCount(input)).toBe('0 artículos')
  })
})
