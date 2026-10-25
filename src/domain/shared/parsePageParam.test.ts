import { describe, it, expect } from 'vitest'
import { parsePageParam } from './parsePageParam'

describe('parsePageParam', () => {
  it('returns the page for a positive integer string', () => {
    expect(parsePageParam('5')).toBe(5)
    expect(parsePageParam('1')).toBe(1)
    expect(parsePageParam('007')).toBe(7)
  })

  it.each([
    undefined,
    null,
    '',
    ' ',
    'abc',
    '0',
    '-3',
    '2.7',
    '1e3',
    '+2',
    ' 2',
    '0x10',
    'NaN',
    'Infinity',
  ])('falls back to 1 for %j', (raw) => {
    expect(parsePageParam(raw)).toBe(1)
  })

  it('falls back to 1 for non-string values, including repeated params', () => {
    expect(parsePageParam(['1', '2'])).toBe(1)
    expect(parsePageParam([])).toBe(1)
    expect(parsePageParam(3)).toBe(1)
    expect(parsePageParam({})).toBe(1)
  })

  it('falls back to 1 when the number is too large to be a safe integer', () => {
    expect(parsePageParam('9'.repeat(30))).toBe(1)
    expect(parsePageParam(String(Number.MAX_SAFE_INTEGER))).toBe(Number.MAX_SAFE_INTEGER)
  })
})
