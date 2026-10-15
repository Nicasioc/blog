import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { GamSizeMappingEntry } from '@/domain/ads/gamSizeMapping.utils'

// gpt.ts keeps page-global state (services enabled, pending SRA batch), so
// every test imports a fresh copy.
const loadGpt = async () => {
  vi.resetModules()
  return import('./gpt')
}

type FakeSlot = {
  divId: string
  defineSizeMapping: ReturnType<typeof vi.fn>
  addService: ReturnType<typeof vi.fn>
}

// Mimics gpt.js: commands queue until load(), which drains them
// synchronously; afterwards push() runs commands immediately.
const installFakeGoogletag = ({ defineReturnsNull = false } = {}) => {
  const queue: Array<() => void> = []
  const state = { loaded: false }
  const pubads = {
    enableSingleRequest: vi.fn(() => true),
    disableInitialLoad: vi.fn(),
    refresh: vi.fn(),
    setPrivacySettings: vi.fn(),
  }
  const googletag = {
    cmd: {
      push: (...commands: Array<() => void>) => {
        if (state.loaded) commands.forEach((command) => command())
        else queue.push(...commands)
      },
    },
    pubads: () => pubads,
    enableServices: vi.fn(),
    defineSlot: vi.fn((_path: string, _sizes: unknown, divId: string): FakeSlot | null => {
      if (defineReturnsNull) return null
      const slot: FakeSlot = {
        divId,
        defineSizeMapping: vi.fn(() => slot),
        addService: vi.fn(() => slot),
      }
      return slot
    }),
    display: vi.fn(),
    destroySlots: vi.fn(() => true),
  }
  ;(window as unknown as { googletag: unknown }).googletag = googletag
  const load = () => {
    state.loaded = true
    queue.splice(0).forEach((command) => command())
  }
  return { googletag, pubads, load }
}

const flushMicrotasks = () => Promise.resolve()

const SIZES: Array<[number, number]> = [
  [300, 250],
  [336, 280],
]
const SIZE_MAPPING: GamSizeMappingEntry[] = [[[0, 0], SIZES]]

const slotArgs = (divId: string) => ({
  adUnitPath: '/123/sidebar',
  sizes: SIZES,
  sizeMapping: SIZE_MAPPING,
  divId,
})

describe('buildGptDivId', () => {
  it('strips characters outside [A-Za-z0-9_-] from the React id', async () => {
    const { buildGptDivId } = await loadGpt()
    expect(buildGptDivId('sidebar', ':r1:')).toBe('gpt-sidebar-r1')
    expect(buildGptDivId('in-content', '«r2»')).toBe('gpt-in-content-r2')
  })
})

describe('displayGptSlot', () => {
  beforeEach(() => {
    delete (window as { googletag?: unknown }).googletag
  })

  it('does nothing until gpt.js drains the command queue', async () => {
    const { displayGptSlot } = await loadGpt()
    const { googletag } = installFakeGoogletag()

    displayGptSlot(slotArgs('gpt-a'))

    expect(googletag.defineSlot).not.toHaveBeenCalled()
    expect(googletag.enableServices).not.toHaveBeenCalled()
  })

  it('defines, maps, displays and fetches the slot once gpt.js loads', async () => {
    const { displayGptSlot } = await loadGpt()
    const { googletag, pubads, load } = installFakeGoogletag()

    displayGptSlot(slotArgs('gpt-a'))
    load()
    await flushMicrotasks()

    expect(googletag.defineSlot).toHaveBeenCalledWith('/123/sidebar', SIZES, 'gpt-a')
    const slot = googletag.defineSlot.mock.results[0].value as FakeSlot
    expect(slot.defineSizeMapping).toHaveBeenCalledWith(SIZE_MAPPING)
    expect(slot.addService).toHaveBeenCalledWith(pubads)
    expect(googletag.display).toHaveBeenCalledWith('gpt-a')
    expect(pubads.refresh).toHaveBeenCalledWith([slot])
  })

  it('enables SRA, initial-load deferral and services exactly once across slots', async () => {
    const { displayGptSlot } = await loadGpt()
    const { googletag, pubads, load } = installFakeGoogletag()

    displayGptSlot(slotArgs('gpt-a'))
    displayGptSlot(slotArgs('gpt-b'))
    load()
    await flushMicrotasks()
    displayGptSlot(slotArgs('gpt-c'))
    await flushMicrotasks()

    expect(pubads.enableSingleRequest).toHaveBeenCalledTimes(1)
    expect(pubads.disableInitialLoad).toHaveBeenCalledTimes(1)
    expect(googletag.enableServices).toHaveBeenCalledTimes(1)
  })

  it('fetches every slot queued before load in a single refresh call', async () => {
    const { displayGptSlot } = await loadGpt()
    const { googletag, pubads, load } = installFakeGoogletag()

    displayGptSlot(slotArgs('gpt-a'))
    displayGptSlot(slotArgs('gpt-b'))
    load()
    await flushMicrotasks()

    const [slotA, slotB] = googletag.defineSlot.mock.results.map((r) => r.value)
    expect(pubads.refresh).toHaveBeenCalledTimes(1)
    expect(pubads.refresh).toHaveBeenCalledWith([slotA, slotB])
  })

  it('never defines a slot whose cleanup ran before gpt.js loaded (strict-mode double mount)', async () => {
    const { displayGptSlot } = await loadGpt()
    const { googletag, pubads, load } = installFakeGoogletag()

    const cleanupFirstMount = displayGptSlot(slotArgs('gpt-a'))
    cleanupFirstMount()
    displayGptSlot(slotArgs('gpt-a'))
    load()
    await flushMicrotasks()

    expect(googletag.defineSlot).toHaveBeenCalledTimes(1)
    expect(googletag.destroySlots).not.toHaveBeenCalled()
    expect(pubads.refresh).toHaveBeenCalledTimes(1)
  })

  it('destroys the slot on cleanup after it was defined', async () => {
    const { displayGptSlot } = await loadGpt()
    const { googletag, load } = installFakeGoogletag()

    const cleanup = displayGptSlot(slotArgs('gpt-a'))
    load()
    await flushMicrotasks()
    cleanup()

    const slot = googletag.defineSlot.mock.results[0].value
    expect(googletag.destroySlots).toHaveBeenCalledWith([slot])
  })

  it('drops a slot destroyed before the batch flushes from the refresh call', async () => {
    const { displayGptSlot } = await loadGpt()
    const { googletag, pubads, load } = installFakeGoogletag()
    load()

    const cleanupA = displayGptSlot(slotArgs('gpt-a'))
    displayGptSlot(slotArgs('gpt-b'))
    cleanupA()
    await flushMicrotasks()

    const slotB = googletag.defineSlot.mock.results[1].value
    expect(pubads.refresh).toHaveBeenCalledWith([slotB])
  })

  it('skips display and fetch when defineSlot returns null (div already has a slot)', async () => {
    const { displayGptSlot } = await loadGpt()
    const { googletag, pubads, load } = installFakeGoogletag({ defineReturnsNull: true })

    const cleanup = displayGptSlot(slotArgs('gpt-a'))
    load()
    await flushMicrotasks()
    cleanup()

    expect(googletag.display).not.toHaveBeenCalled()
    expect(pubads.refresh).not.toHaveBeenCalled()
    expect(googletag.destroySlots).not.toHaveBeenCalled()
  })

  it('creates the command queue itself when window.googletag is missing', async () => {
    const { displayGptSlot } = await loadGpt()

    displayGptSlot(slotArgs('gpt-a'))

    const { googletag } = window as unknown as { googletag: { cmd: unknown[] } }
    expect(googletag.cmd).toHaveLength(1)
  })
})

describe('setGptPersonalization', () => {
  beforeEach(() => {
    delete (window as { googletag?: unknown }).googletag
  })

  it.each([
    ['non-personalized', true],
    ['personalized', false],
  ] as const)('maps %s to nonPersonalizedAds=%s', async (personalization, expected) => {
    const { setGptPersonalization } = await loadGpt()
    const { pubads, load } = installFakeGoogletag()

    setGptPersonalization(personalization)
    load()

    expect(pubads.setPrivacySettings).toHaveBeenCalledWith({ nonPersonalizedAds: expected })
  })
})
