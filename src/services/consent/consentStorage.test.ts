import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getConsentServerSnapshot,
  getConsentSnapshot,
  setConsentStatus,
  subscribeConsent,
} from './consentStorage'
import { CONSENT_STORAGE_KEY } from '@/domain/consent/consent.model'

beforeEach(() => {
  window.localStorage.clear()
})

describe('getConsentSnapshot', () => {
  it('returns null when nothing is stored', () => {
    expect(getConsentSnapshot()).toBeNull()
  })

  it('returns the stored status when valid', () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, 'accepted')
    expect(getConsentSnapshot()).toBe('accepted')
  })

  it('returns null for a corrupted stored value', () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, 'garbage')
    expect(getConsentSnapshot()).toBeNull()
  })
})

describe('getConsentServerSnapshot', () => {
  it('always returns null regardless of storage', () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, 'accepted')
    expect(getConsentServerSnapshot()).toBeNull()
  })
})

describe('setConsentStatus', () => {
  it('persists the value and notifies subscribers', () => {
    const listener = vi.fn()
    subscribeConsent(listener)

    setConsentStatus('rejected')

    expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toBe('rejected')
    expect(listener).toHaveBeenCalledOnce()
  })

  it('stops notifying a listener after it unsubscribes', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeConsent(listener)
    unsubscribe()

    setConsentStatus('accepted')

    expect(listener).not.toHaveBeenCalled()
  })
})
