import { StrictMode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'

// AD_PLACEMENTS is built from siteConfig at module-eval time (see
// AdSenseProvider.test.tsx), so `footer` stays permanently unconfigured for
// the null path; getGamAdUnitPath reads gamNetworkCode live.
const mockAds = vi.hoisted(() => ({
  gamNetworkCode: '123456' as string | undefined,
}))

vi.mock('@/lib/siteConfig', () => ({
  siteConfig: {
    ads: {
      provider: 'gam',
      slots: {},
      get gamNetworkCode() {
        return mockAds.gamNetworkCode
      },
      gamSlots: {
        'header-leaderboard': 'header',
        sidebar: 'sidebar',
        footer: '',
      },
    },
  },
}))

type FakeSlot = { defineSizeMapping: () => FakeSlot; addService: () => FakeSlot }

// Queues commands like gpt.js does before it loads; load() drains them.
const installFakeGoogletag = () => {
  const queue: Array<() => void> = []
  const state = { loaded: false }
  const pubads = {
    enableSingleRequest: vi.fn(),
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
    defineSlot: vi.fn((): FakeSlot => {
      const slot: FakeSlot = { defineSizeMapping: () => slot, addService: () => slot }
      return slot
    }),
    display: vi.fn(),
    destroySlots: vi.fn(),
  }
  ;(window as unknown as { googletag: unknown }).googletag = googletag
  const load = () => {
    state.loaded = true
    queue.splice(0).forEach((command) => command())
  }
  return { googletag, pubads, load }
}

const loadGamSlot = async () => {
  vi.resetModules()
  return (await import('./GamProvider')).GamSlot
}

describe('GamSlot', () => {
  beforeEach(() => {
    delete (window as { googletag?: unknown }).googletag
    mockAds.gamNetworkCode = '123456'
  })

  it('renders nothing and queues no commands when the placement has no GAM ad unit', async () => {
    const GamSlot = await loadGamSlot()
    const { googletag, pubads, load } = installFakeGoogletag()

    const { container } = render(<GamSlot placement="footer" personalization="personalized" />)
    load()

    expect(container).toBeEmptyDOMElement()
    expect(googletag.defineSlot).not.toHaveBeenCalled()
    expect(pubads.setPrivacySettings).not.toHaveBeenCalled()
  })

  it('renders nothing when the network code is missing', async () => {
    mockAds.gamNetworkCode = undefined
    const GamSlot = await loadGamSlot()
    installFakeGoogletag()

    const { container } = render(<GamSlot placement="sidebar" personalization="personalized" />)

    expect(container).toBeEmptyDOMElement()
  })

  it('renders a full-width div with a sanitised id and reserved dimensions', async () => {
    const GamSlot = await loadGamSlot()
    installFakeGoogletag()

    const { container } = render(
      <GamSlot placement="sidebar" className="my-4" personalization="personalized" />,
    )
    const div = container.firstElementChild as HTMLElement

    expect(div.id).toMatch(/^gpt-sidebar-[A-Za-z0-9_-]+$/)
    expect(div).toHaveClass('w-full', 'my-4')
    // sidebar sizes: 300x250, 300x600, 160x600 → smallest height, widest width
    expect(div.style.minHeight).toBe('250px')
    expect(div.style.maxWidth).toBe('300px')
  })

  it('defines the slot against its own div with the full ad unit path', async () => {
    const GamSlot = await loadGamSlot()
    const { googletag, load } = installFakeGoogletag()

    const { container } = render(<GamSlot placement="sidebar" personalization="personalized" />)
    load()

    const divId = (container.firstElementChild as HTMLElement).id
    expect(googletag.defineSlot).toHaveBeenCalledWith(
      '/123456/sidebar',
      [
        [300, 250],
        [300, 600],
        [160, 600],
      ],
      divId,
    )
    expect(googletag.display).toHaveBeenCalledWith(divId)
  })

  it('defines the slot once under React strict mode', async () => {
    const GamSlot = await loadGamSlot()
    const { googletag, load } = installFakeGoogletag()

    render(
      <StrictMode>
        <GamSlot placement="sidebar" personalization="personalized" />
      </StrictMode>,
    )
    load()

    expect(googletag.defineSlot).toHaveBeenCalledTimes(1)
  })

  it('enables services once across several mounted slots', async () => {
    const GamSlot = await loadGamSlot()
    const { googletag, pubads, load } = installFakeGoogletag()

    render(
      <>
        <GamSlot placement="sidebar" personalization="personalized" />
        <GamSlot placement="header-leaderboard" personalization="personalized" />
      </>,
    )
    load()

    expect(googletag.defineSlot).toHaveBeenCalledTimes(2)
    expect(pubads.enableSingleRequest).toHaveBeenCalledTimes(1)
    expect(googletag.enableServices).toHaveBeenCalledTimes(1)
  })

  it('destroys the slot on unmount', async () => {
    const GamSlot = await loadGamSlot()
    const { googletag, load } = installFakeGoogletag()

    const { unmount } = render(<GamSlot placement="sidebar" personalization="personalized" />)
    load()
    unmount()

    const slot = googletag.defineSlot.mock.results[0].value
    expect(googletag.destroySlots).toHaveBeenCalledWith([slot])
  })

  it('requests non-personalized ads, then follows a personalization change', async () => {
    const GamSlot = await loadGamSlot()
    const { pubads, load } = installFakeGoogletag()

    const { rerender } = render(<GamSlot placement="sidebar" personalization="non-personalized" />)
    load()
    expect(pubads.setPrivacySettings).toHaveBeenLastCalledWith({ nonPersonalizedAds: true })

    rerender(<GamSlot placement="sidebar" personalization="personalized" />)
    expect(pubads.setPrivacySettings).toHaveBeenLastCalledWith({ nonPersonalizedAds: false })
  })
})
