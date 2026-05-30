import { describe, it, expect } from 'vitest'
import { isNil, isNonEmptyString, isNonEmptyArray, isNonEmptyObject } from '@/utils/checks'

describe('isNil', () => {
  it('returns true for null', () => expect(isNil(null)).toBe(true))
  it('returns true for undefined', () => expect(isNil(undefined)).toBe(true))
  it('returns false for empty string', () => expect(isNil('')).toBe(false))
  it('returns false for 0', () => expect(isNil(0)).toBe(false))
  it('returns false for false', () => expect(isNil(false)).toBe(false))
  it('returns false for NaN', () => expect(isNil(NaN)).toBe(false))
})

describe('isNonEmptyString', () => {
  it('returns true for non-empty string', () => expect(isNonEmptyString('hello')).toBe(true))
  it('returns false for empty string', () => expect(isNonEmptyString('')).toBe(false))
  it('returns false for whitespace-only string', () => expect(isNonEmptyString('  ')).toBe(false))
  it('returns false for number', () => expect(isNonEmptyString(42)).toBe(false))
  it('returns false for null', () => expect(isNonEmptyString(null)).toBe(false))
  it('returns false for undefined', () => expect(isNonEmptyString(undefined)).toBe(false))
})

describe('isNonEmptyArray', () => {
  it('returns true for non-empty array', () => expect(isNonEmptyArray([1, 2])).toBe(true))
  it('returns true for array with one element', () => expect(isNonEmptyArray([0])).toBe(true))
  it('returns false for empty array', () => expect(isNonEmptyArray([])).toBe(false))
  it('returns false for null', () => expect(isNonEmptyArray(null)).toBe(false))
  it('returns false for undefined', () => expect(isNonEmptyArray(undefined)).toBe(false))
  it('returns false for object', () => expect(isNonEmptyArray({})).toBe(false))
  it('returns false for string', () => expect(isNonEmptyArray('abc')).toBe(false))
})

describe('isNonEmptyObject', () => {
  it('returns true for object with keys', () => expect(isNonEmptyObject({ a: 1 })).toBe(true))
  it('returns false for empty object', () => expect(isNonEmptyObject({})).toBe(false))
  it('returns false for array', () => expect(isNonEmptyObject([1, 2])).toBe(false))
  it('returns false for null', () => expect(isNonEmptyObject(null)).toBe(false))
  it('returns false for undefined', () => expect(isNonEmptyObject(undefined)).toBe(false))
  it('returns false for string', () => expect(isNonEmptyObject('abc')).toBe(false))
  it('returns false for number', () => expect(isNonEmptyObject(42)).toBe(false))
})
