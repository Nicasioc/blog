import {
  CONSENT_STORAGE_KEY,
  isConsentStatus,
  type ConsentStatus,
} from '@/domain/consent/consent.model'

type Listener = () => void

const listeners = new Set<Listener>()

export const subscribeConsent = (listener: Listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const getConsentSnapshot = (): ConsentStatus | null => {
  const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY)
  return isConsentStatus(stored) ? stored : null
}

export const getConsentServerSnapshot = (): ConsentStatus | null => null

export const setConsentStatus = (value: ConsentStatus): void => {
  window.localStorage.setItem(CONSENT_STORAGE_KEY, value)
  listeners.forEach((listener) => listener())
}
