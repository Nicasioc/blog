'use client'
import Script from 'next/script'
import { siteConfig } from '@/lib/siteConfig'
import { isNonEmptyString } from '@/utils/checks'

// Mirrors AdSenseScript's gate: consent does not gate the tag itself, only ad
// personalization (BLO-193) — the GPT side of that lands in BLO-146.
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
// so before any slot component effect (BLO-140) can push a command. gpt.js
// reuses an existing window.googletag rather than replacing it, then drains
// whatever queued up while it was in flight.
if (typeof window !== 'undefined' && isGamConfigured()) {
  const w = window as { googletag?: { cmd: unknown[] } }
  w.googletag = w.googletag ?? { cmd: [] }
}

// This ticket loads gpt.js and nothing else; defineSlot/enableServices belong
// to GamProvider (BLO-140).
export const GamScript = () => {
  if (!isGamConfigured()) return null

  return (
    <Script
      src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"
      strategy="afterInteractive"
    />
  )
}
