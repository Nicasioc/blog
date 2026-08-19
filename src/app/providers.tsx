'use client'
import type { ReactNode } from 'react'
import { ConsentProvider } from '@/components/consent/ConsentContext'
import { CookieConsentBanner } from '@/components/consent/CookieConsentBanner'
import { AdProvider } from '@/components/ads/AdProvider'
import { AdSenseScript } from '@/components/ads/AdSenseScript'

export const Providers = ({ children }: { children: ReactNode }) => (
  <ConsentProvider>
    <AdProvider>
      {children}
      <AdSenseScript />
      <CookieConsentBanner />
    </AdProvider>
  </ConsentProvider>
)
