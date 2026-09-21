'use client'
import { createContext, useContext, type ReactNode } from 'react'
import { AdSenseSlot } from './providers/AdSenseProvider'
import type { AdPlacement } from '@/services/ads/adConfig'
import { siteConfig } from '@/lib/siteConfig'
import { useConsent } from '@/components/consent/ConsentContext'
import { getAdPersonalization } from '@/domain/consent/adPersonalization'

type AdProviderContextValue = {
  renderSlot: (placement: AdPlacement, className?: string) => ReactNode
}

const AdContext = createContext<AdProviderContextValue>({ renderSlot: () => null })

export const useAdProvider = () => useContext(AdContext)

export const AdProvider = ({ children }: { children: ReactNode }) => {
  const provider = siteConfig.ads.provider
  const { status } = useConsent()
  // Ads render regardless of consent status — status only decides whether
  // the slot requests personalized or non-personalized ads. See BLO-193.
  const personalization = getAdPersonalization(status)

  const renderSlot = (placement: AdPlacement, className?: string): ReactNode => {
    if (!siteConfig.ads.enabled) return null

    switch (provider) {
      case 'adsense':
        return (
          <AdSenseSlot
            placement={placement}
            className={className}
            personalization={personalization}
          />
        )
      default:
        return null
    }
  }

  return <AdContext.Provider value={{ renderSlot }}>{children}</AdContext.Provider>
}
