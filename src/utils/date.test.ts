import { describe, it, expect } from 'vitest'
import { parseDate, parseDateOr, latestDate } from '@/utils/date'

describe('parseDate', () => {
  it('parses an ISO string', () => {
    expect(parseDate('2026-01-02T03:04:05.000Z')?.toISOString()).toBe('2026-01-02T03:04:05.000Z')
  })

  it('returns a valid Date unchanged', () => {
    const date = new Date('2026-05-05T00:00:00.000Z')
    expect(parseDate(date)).toBe(date)
  })

  it('parses an epoch millisecond number', () => {
    expect(parseDate(0)?.toISOString()).toBe('1970-01-01T00:00:00.000Z')
  })

  it.each([undefined, null, '', 'not-a-date', {}, [], NaN, new Date('nope')])(
    'returns null for unusable input %o',
    (input) => {
      expect(parseDate(input)).toBeNull()
    },
  )
})

describe('parseDateOr', () => {
  const fallback = new Date('2000-01-01T00:00:00.000Z')

  it('returns the parsed date when valid', () => {
    expect(parseDateOr('2026-01-01T00:00:00.000Z', fallback).toISOString()).toBe(
      '2026-01-01T00:00:00.000Z',
    )
  })

  it('returns the fallback when the value is missing or malformed', () => {
    expect(parseDateOr(undefined, fallback)).toBe(fallback)
    expect(parseDateOr('garbage', fallback)).toBe(fallback)
    expect(parseDateOr(null, fallback)).toBe(fallback)
  })
})

describe('latestDate', () => {
  const fallback = new Date('2000-01-01T00:00:00.000Z')

  it('returns the most recent date', () => {
    const result = latestDate(
      [
        new Date('2026-01-01T00:00:00.000Z'),
        new Date('2026-06-01T00:00:00.000Z'),
        new Date('2026-03-01T00:00:00.000Z'),
      ],
      fallback,
    )
    expect(result.toISOString()).toBe('2026-06-01T00:00:00.000Z')
  })

  it('ignores invalid dates in the list', () => {
    const result = latestDate([new Date('nope'), new Date('2026-02-02T00:00:00.000Z')], fallback)
    expect(result.toISOString()).toBe('2026-02-02T00:00:00.000Z')
  })

  it('returns the fallback when no valid date is present', () => {
    expect(latestDate([], fallback)).toBe(fallback)
    expect(latestDate([new Date('nope')], fallback)).toBe(fallback)
  })
})
