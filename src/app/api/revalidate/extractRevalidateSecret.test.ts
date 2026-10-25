import { describe, expect, it } from 'vitest'
import { extractRevalidateSecret } from '@/app/api/revalidate/extractRevalidateSecret'

describe('extractRevalidateSecret', () => {
  it('reads the secret from the Bearer header', () => {
    expect(extractRevalidateSecret('Bearer abc', null)).toBe('abc')
  })

  it('treats the Bearer scheme as case-insensitive', () => {
    expect(extractRevalidateSecret('bearer abc', null)).toBe('abc')
    expect(extractRevalidateSecret('BEARER abc', null)).toBe('abc')
  })

  it('prefers the header over the query param', () => {
    expect(extractRevalidateSecret('Bearer header', 'query')).toBe('header')
  })

  it('falls back to the query param when there is no header', () => {
    expect(extractRevalidateSecret(null, 'query')).toBe('query')
  })

  it('falls back to the query param when the header is not a Bearer token', () => {
    expect(extractRevalidateSecret('Basic abc', 'query')).toBe('query')
  })

  it('falls back to the query param when the Bearer value is empty', () => {
    expect(extractRevalidateSecret('Bearer ', 'query')).toBe('query')
    expect(extractRevalidateSecret('Bearer    ', 'query')).toBe('query')
  })

  it('returns null for an empty Bearer value with no query param', () => {
    expect(extractRevalidateSecret('Bearer ', null)).toBeNull()
  })

  it('returns null when nothing is provided', () => {
    expect(extractRevalidateSecret(null, null)).toBeNull()
    expect(extractRevalidateSecret('', '')).toBeNull()
  })

  it('handles non-string inputs from malformed callers', () => {
    const malformed = undefined as unknown as string
    expect(extractRevalidateSecret(malformed, malformed)).toBeNull()
  })
})
