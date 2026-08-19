import { describe, it, expect } from 'vitest'
import { isConsentStatus } from './consent.model'

describe('isConsentStatus', () => {
  it('accepts the two known consent values', () => {
    expect(isConsentStatus('accepted')).toBe(true)
    expect(isConsentStatus('rejected')).toBe(true)
  })

  it('rejects unknown strings, null, undefined and non-string values', () => {
    expect(isConsentStatus('maybe')).toBe(false)
    expect(isConsentStatus('')).toBe(false)
    expect(isConsentStatus(null)).toBe(false)
    expect(isConsentStatus(undefined)).toBe(false)
    expect(isConsentStatus(42)).toBe(false)
  })
})
