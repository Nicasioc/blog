export type ConsentStatus = 'accepted' | 'rejected'

export const CONSENT_STORAGE_KEY = 'cookie-consent'

export const isConsentStatus = (value: unknown): value is ConsentStatus =>
  value === 'accepted' || value === 'rejected'
