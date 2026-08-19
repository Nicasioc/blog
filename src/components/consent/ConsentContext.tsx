'use client'
import { createContext, useContext, useState, useSyncExternalStore, type ReactNode } from 'react'
import type { ConsentStatus } from '@/domain/consent/consent.model'
import {
  getConsentServerSnapshot,
  getConsentSnapshot,
  setConsentStatus,
  subscribeConsent,
} from '@/services/consent/consentStorage'

type ConsentContextValue = {
  status: ConsentStatus | null
  isPreferencesOpen: boolean
  accept: () => void
  reject: () => void
  openPreferences: () => void
  closePreferences: () => void
}

const ConsentContext = createContext<ConsentContextValue>({
  status: null,
  isPreferencesOpen: false,
  accept: () => {},
  reject: () => {},
  openPreferences: () => {},
  closePreferences: () => {},
})

export const useConsent = () => useContext(ConsentContext)

export const ConsentProvider = ({ children }: { children: ReactNode }) => {
  const status = useSyncExternalStore(
    subscribeConsent,
    getConsentSnapshot,
    getConsentServerSnapshot,
  )
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false)

  const persist = (value: ConsentStatus) => {
    setConsentStatus(value)
    setIsPreferencesOpen(false)
  }

  return (
    <ConsentContext.Provider
      value={{
        status,
        isPreferencesOpen,
        accept: () => persist('accepted'),
        reject: () => persist('rejected'),
        openPreferences: () => setIsPreferencesOpen(true),
        closePreferences: () => setIsPreferencesOpen(false),
      }}
    >
      {children}
    </ConsentContext.Provider>
  )
}
