import type { AdPersonalization } from '@/domain/consent/adPersonalization'
import type { GamSizeMappingEntry } from '@/domain/ads/gamSizeMapping.utils'

// Minimal slice of the Google Publisher Tag API this repo uses. Kept local
// rather than pulling in @types/google-publisher-tag for six methods.
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

// GamScript (BLO-139) already initialises the queue at module scope; this is a
// defensive fallback so a slot never pushes onto an undefined queue.
const getGoogletag = (): GoogleTag => {
  const w = window as unknown as { googletag?: GoogleTag }
  w.googletag = w.googletag ?? ({ cmd: [] } as unknown as GoogleTag)
  return w.googletag
}

// Module-level state: GPT services are page-global, so these must outlive any
// single slot component.
let servicesEnabled = false
let pendingSlots: GptSlot[] = []
let flushScheduled = false

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

// Page-level setting, applied to every subsequent ad request. Idempotent, so
// each mounted slot pushing it is harmless. See BLO-193 for the policy.
export const setGptPersonalization = (personalization: AdPersonalization): void => {
  const googletag = getGoogletag()
  googletag.cmd.push(() => {
    googletag
      .pubads()
      .setPrivacySettings({ nonPersonalizedAds: personalization === 'non-personalized' })
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
  const googletag = getGoogletag()
  const state: { cancelled: boolean; slot: GptSlot | null } = { cancelled: false, slot: null }

  googletag.cmd.push(() => {
    if (state.cancelled) return
    ensureServices(googletag)
    const slot = googletag.defineSlot(adUnitPath, sizes, divId)
    // defineSlot returns null when the div already has a slot.
    if (!slot) return
    slot.defineSizeMapping(sizeMapping).addService(googletag.pubads())
    googletag.display(divId)
    state.slot = slot
    scheduleRefresh(googletag, slot)
  })

  return () => {
    state.cancelled = true
    googletag.cmd.push(() => {
      const { slot } = state
      if (!slot) return
      pendingSlots = pendingSlots.filter((pending) => pending !== slot)
      googletag.destroySlots([slot])
    })
  }
}
