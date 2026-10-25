import { describe, it, expect } from 'vitest'
import { getAuthorInitial } from './commentInitial'

describe('getAuthorInitial', () => {
  it('uppercases the first ASCII letter', () => {
    expect(getAuthorInitial('jane')).toBe('J')
  })

  it('handles accented characters', () => {
    expect(getAuthorInitial('ángel')).toBe('Á')
  })

  it('keeps an emoji whole instead of splitting its surrogate pair', () => {
    expect(getAuthorInitial('😀 Pepe')).toBe('😀')
    expect(getAuthorInitial('😀 Pepe')).toHaveLength(2)
  })

  it('keeps flags, ZWJ sequences and combining accents whole', () => {
    expect(getAuthorInitial('🇦🇷 Juan')).toBe('🇦🇷')
    expect(getAuthorInitial('👨‍👩‍👧 Familia')).toBe('👨‍👩‍👧')
    expect(getAuthorInitial('e\u0301mile')).toBe('E\u0301')
  })

  it('skips leading whitespace', () => {
    expect(getAuthorInitial('   bob')).toBe('B')
  })

  it('falls back for empty or whitespace-only input', () => {
    expect(getAuthorInitial('')).toBe('?')
    expect(getAuthorInitial('   ')).toBe('?')
  })
})
