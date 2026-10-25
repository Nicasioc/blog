import { describe, expect, it } from 'vitest'
import { parseBearerToken } from '@/app/api/revalidate/parseBearerToken'

describe('parseBearerToken', () => {
  it('reads the token from a Bearer header', () => {
    expect(parseBearerToken('Bearer abc')).toBe('abc')
  })

  it('treats the Bearer scheme as case-insensitive', () => {
    expect(parseBearerToken('bearer abc')).toBe('abc')
    expect(parseBearerToken('BEARER abc')).toBe('abc')
  })

  it('returns null for a non-Bearer scheme', () => {
    expect(parseBearerToken('Basic abc')).toBeNull()
  })

  it('returns null when the Bearer value is empty or whitespace', () => {
    expect(parseBearerToken('Bearer ')).toBeNull()
    expect(parseBearerToken('Bearer    ')).toBeNull()
  })

  it('returns null when the header is missing or empty', () => {
    expect(parseBearerToken(null)).toBeNull()
    expect(parseBearerToken('')).toBeNull()
  })

  it('handles non-string inputs from malformed callers', () => {
    expect(parseBearerToken(undefined as unknown as string)).toBeNull()
  })
})
