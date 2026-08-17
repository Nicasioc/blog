import { describe, expect, it } from 'vitest'
import { formatPostDate, formatPostDateLong } from './postDate.utils'

describe('formatPostDate', () => {
  it('formats a valid date with an abbreviated month', () => {
    expect(formatPostDate(new Date('2026-03-05T12:00:00Z'))).toBe('Mar 5, 2026')
  })

  it('returns an empty string for an invalid date', () => {
    expect(formatPostDate(new Date('not-a-date'))).toBe('')
  })

  it('returns an empty string when the value is not a Date', () => {
    expect(formatPostDate('2026-03-05' as unknown as Date)).toBe('')
    expect(formatPostDate(null as unknown as Date)).toBe('')
    expect(formatPostDate(undefined as unknown as Date)).toBe('')
  })
})

describe('formatPostDateLong', () => {
  it('formats a valid date with a full month name', () => {
    expect(formatPostDateLong(new Date('2026-03-05T12:00:00Z'))).toBe('March 5, 2026')
  })

  it('returns an empty string for an invalid date', () => {
    expect(formatPostDateLong(new Date('not-a-date'))).toBe('')
  })

  it('returns an empty string when the value is not a Date', () => {
    expect(formatPostDateLong({} as unknown as Date)).toBe('')
  })
})
