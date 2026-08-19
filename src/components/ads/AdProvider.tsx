'use client'
import { createContext, useContext, type ReactNode } from 'react'
import { AdSenseSlot } from './providers/AdSenseProvider'
import type { AdPlacement } from '@/services/ads/adConfig'
import { clientEnv } from '@/lib/env.client'
import { useConsent } from '@/components/consent/ConsentContext'

type AdProviderContextValue = {
  renderSlot: (placement: AdPlacement, className?: string) => ReactNode
}

const AdContext = createContext<AdProviderContextValue>({ renderSlot: () => null })

export const useAdProvider = () => useContext(AdContext)

export const AdProvider = ({ children }: { children: ReactNode }) => {
  const provider = clientEnv.NEXT_PUBLIC_AD_PROVIDER
  const { status } = useConsent()

  const renderSlot = (placement: AdPlacement, className?: string): ReactNode => {
    if (status !== 'accepted') return null

    switch (provider) {
      case 'adsense':
        return <AdSenseSlot placement={placement} className={className} />
      default:
        return null
    }
  }

  return <AdContext.Provider value={{ renderSlot }}>{children}</AdContext.Provider>
}
