'use client'
import { useEffect } from 'react'
import Script from 'next/script'
import { siteConfig } from '@/lib/siteConfig'
import { isNonEmptyString } from '@/utils/checks'
import { useConsent } from '@/components/consent/ConsentContext'
import { getAdPersonalization } from '@/domain/consent/adPersonalization'
import { ensureGoogletagQueue, setGptPersonalization } from '@/services/ads/gpt'

// Mirrors AdSenseScript's gate: consent does not gate the tag itself, only ad
// personalization (BLO-193), which this component also applies below.
const isGamConfigured = () =>
  siteConfig.ads.enabled &&
  siteConfig.ads.provider === 'gam' &&
  isNonEmptyString(siteConfig.ads.gamNetworkCode)

// The command queue is initialised here, at module scope, rather than from an
// inline <Script>: next/script hoists an afterInteractive external script into
// <head> right away, so an inline <Script> rendered alongside it in the tree
// executes *after* gpt.js is already requested (confirmed against a real DOM
// dump, where the inline tag landed ~104KB further down the document). Module
// scope runs when the client bundle imports this file — before hydration, and
// so before any GamSlot effect can push a command. gpt.js reuses an existing
// window.googletag rather than replacing it, then drains whatever queued up
// while it was in flight.
if (typeof window !== 'undefined' && isGamConfigured()) {
  ensureGoogletagQueue()
}

// Loads gpt.js and applies the page-level personalization setting; slot
// definition lives in GamSlot (BLO-140).
export const GamScript = () => {
  const { status } = useConsent()
  const personalization = getAdPersonalization(status)

  // Re-runs when consent corrects from the SSR null snapshot after hydration,
  // and when the visitor answers the banner — never capture it once (BLO-193).
  // Queue order vs. slot defines doesn't matter: the batched fetch runs in a
  // microtask after gpt.js drains the whole queue.
  useEffect(() => {
    if (!isGamConfigured()) return
    setGptPersonalization(personalization)
  }, [personalization])

  if (!isGamConfigured()) return null

  return (
    <Script
      src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"
      strategy="afterInteractive"
    />
  )
}
