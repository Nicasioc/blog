import { describe, it, expect } from 'vitest'
import { getAdPersonalization } from './adPersonalization'

describe('getAdPersonalization', () => {
  it('returns personalized when consent is accepted', () => {
    expect(getAdPersonalization('accepted')).toBe('personalized')
  })

  it('returns non-personalized when consent is rejected (BLO-193)', () => {
    expect(getAdPersonalization('rejected')).toBe('non-personalized')
  })

  it('returns non-personalized when consent is unanswered / null (BLO-193)', () => {
    expect(getAdPersonalization(null)).toBe('non-personalized')
  })
})
