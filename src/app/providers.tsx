'use client'
import { AdProvider } from '@/components/ads/AdProvider'
import type { ReactNode } from 'react'

export const Providers = ({ children }: { children: ReactNode }) => (
  <AdProvider>{children}</AdProvider>
)
