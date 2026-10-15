import type { AdPersonalization } from '@/domain/consent/adPersonalization'
import type { GamSizeMappingEntry } from '@/domain/ads/gamSizeMapping.utils'
import { isNil } from '@/utils/checks'

// Minimal slice of the Google Publisher Tag API this repo uses. Kept local
// rather than pulling in @types/google-publisher-tag for a handful of methods.
export type GptSlot = {
  defineSizeMapping: (mapping: GamSizeMappingEntry[]) => GptSlot
  addService: (service: GptPubAdsService) => GptSlot
}

type GptPubAdsService = {
  enableSingleRequest: () => boolean
  disableInitialLoad: () => void
  refresh: (slots?: GptSlot[]) => void
  setPrivacySettings: (settings: { nonPersonalizedAds?: boolean }) => unknown
}

type GoogleTag = {
  // An array before gpt.js loads; gpt.js swaps in an object whose push()
  // runs the callback immediately.
  cmd: { push: (...commands: Array<() => void>) => unknown }
  pubads: () => GptPubAdsService
  enableServices: () => void
  defineSlot: (adUnitPath: string, sizes: Array<[number, number]>, divId: string) => GptSlot | null
  display: (divId: string) => void
  destroySlots: (slots?: GptSlot[]) => boolean
}

// The one place window.googletag is bootstrapped. GamScript calls it at module
// scope (before gpt.js is requested, see the comment there); every function
// below calls it too, so a command is never pushed onto an undefined queue.
export const ensureGoogletagQueue = (): GoogleTag => {
  const w = window as unknown as { googletag?: GoogleTag }
  w.googletag = w.googletag ?? ({ cmd: [] } as unknown as GoogleTag)
  return w.googletag
}

// Module-level state: GPT services are page-global, so these must outlive any
// single slot component.
let servicesEnabled = false
let pendingSlots: GptSlot[] = []
let liveSlots: GptSlot[] = []
let flushScheduled = false
let appliedPersonalization: AdPersonalization | null = null

// Runs once per page. disableInitialLoad() makes display() register a slot
// without fetching it, so slots defined in the same tick can be fetched in a
// single refresh() call — that batching is what enableSingleRequest() (SRA)
// actually needs to do anything when slots are mounted one effect at a time.
const ensureServices = (googletag: GoogleTag) => {
  if (servicesEnabled) return
  servicesEnabled = true
  googletag.pubads().enableSingleRequest()
  googletag.pubads().disableInitialLoad()
  googletag.enableServices()
}

// gpt.js drains its whole queue synchronously when it loads, so a microtask
// scheduled from inside a command runs after every slot queued during
// hydration has been defined — one SRA request for the whole page.
const scheduleRefresh = (googletag: GoogleTag, slot: GptSlot) => {
  pendingSlots = [...pendingSlots, slot]
  if (flushScheduled) return
  flushScheduled = true
  queueMicrotask(() => {
    const batch = pendingSlots
    pendingSlots = []
    flushScheduled = false
    if (batch.length > 0) googletag.pubads().refresh(batch)
  })
}

// useId() output contains `:` / `«»`, legal for getElementById but awkward in
// CSS selectors and GPT console filters.
export const buildGptDivId = (placement: string, reactId: string): string =>
  `gpt-${placement}-${reactId.replace(/[^A-Za-z0-9_-]/g, '')}`

// Page-level setting (BLO-193 policy), applied to every subsequent request.
// When a visitor accepts consent mid-page, slots that were already fetched
// non-personalized are refreshed so they switch over too; slots still in the
// pending batch pick the new setting up on their first fetch anyway.
export const setGptPersonalization = (personalization: AdPersonalization): void => {
  const googletag = ensureGoogletagQueue()
  googletag.cmd.push(() => {
    const previous = appliedPersonalization
    appliedPersonalization = personalization
    googletag
      .pubads()
      .setPrivacySettings({ nonPersonalizedAds: personalization === 'non-personalized' })

    if (previous !== 'non-personalized' || personalization !== 'personalized') return
    const fetched = liveSlots.filter((slot) => !pendingSlots.includes(slot))
    if (fetched.length > 0) googletag.pubads().refresh(fetched)
  })
}

type DisplayGptSlotArgs = {
  adUnitPath: string
  sizes: Array<[number, number]>
  sizeMapping: GamSizeMappingEntry[]
  divId: string
}

// Defines, displays and (batch-)fetches one slot; returns the cleanup that
// destroys it. If cleanup runs before gpt.js has drained the queue — React
// strict mode's mount → unmount → mount, or a fast client navigation — the
// pending define is cancelled instead of defining a slot only to destroy it.
export const displayGptSlot = ({
  adUnitPath,
  sizes,
  sizeMapping,
  divId,
}: DisplayGptSlotArgs): (() => void) => {
  const googletag = ensureGoogletagQueue()
  const state: { cancelled: boolean; slot: GptSlot | null } = { cancelled: false, slot: null }

  googletag.cmd.push(() => {
    if (state.cancelled) return
    ensureServices(googletag)
    const slot = googletag.defineSlot(adUnitPath, sizes, divId)
    // defineSlot returns null when the div already has a slot.
    if (isNil(slot)) return
    slot.defineSizeMapping(sizeMapping).addService(googletag.pubads())
    googletag.display(divId)
    state.slot = slot
    liveSlots = [...liveSlots, slot]
    scheduleRefresh(googletag, slot)
  })

  return () => {
    state.cancelled = true
    googletag.cmd.push(() => {
      const { slot } = state
      if (isNil(slot)) return
      pendingSlots = pendingSlots.filter((pending) => pending !== slot)
      liveSlots = liveSlots.filter((live) => live !== slot)
      googletag.destroySlots([slot])
    })
  }
}
