import { describe, it, expect } from 'vitest'
import { detectBotReason, MIN_FILL_TIME_MS } from './commentAntiSpam'

const NOW = 1_000_000

describe('detectBotReason', () => {
  it('returns null for an empty honeypot and a slow enough submission', () => {
    expect(detectBotReason({ website: '', renderedAt: NOW - MIN_FILL_TIME_MS }, NOW)).toBeNull()
    expect(detectBotReason({ renderedAt: NOW - 60_000 }, NOW)).toBeNull()
  })

  it('flags a filled honeypot, even when the fill time is fine', () => {
    expect(detectBotReason({ website: 'http://spam.test', renderedAt: NOW - 60_000 }, NOW)).toBe(
      'honeypot',
    )
  })

  it('treats a whitespace-only honeypot as empty', () => {
    expect(detectBotReason({ website: '   ', renderedAt: NOW - 60_000 }, NOW)).toBeNull()
  })

  it('flags a submission under the minimum fill time', () => {
    expect(detectBotReason({ renderedAt: NOW - (MIN_FILL_TIME_MS - 1) }, NOW)).toBe('too_fast')
    expect(detectBotReason({ renderedAt: NOW }, NOW)).toBe('too_fast')
  })

  it('does not flag a timestamp in the future (client clock skew)', () => {
    expect(detectBotReason({ renderedAt: NOW + 120_000 }, NOW)).toBeNull()
  })

  it('reports the honeypot before the fill time when both trip', () => {
    expect(detectBotReason({ website: 'x', renderedAt: NOW }, NOW)).toBe('honeypot')
  })
})
