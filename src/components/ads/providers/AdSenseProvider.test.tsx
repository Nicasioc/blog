import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'

// AdSenseSlot resolves AD_PLACEMENTS from the real siteConfig singleton,
// which throws on import without a full clientEnv parse under Vitest — mock
// it the same way adConfig.test.ts does. AD_PLACEMENTS is built once at
// module-eval time, so slot ids can't be swapped per-test the way
// adSensePublisherId can (read live on every render) — `footer` is left
// permanently empty so the "no configured ad unit id" case has a fixed
// placement to target.
let mockPublisherId: string | undefined = 'ca-pub-1234567890123456'

vi.mock('@/lib/siteConfig', () => ({
  siteConfig: {
    ads: {
      provider: 'adsense',
      get adSensePublisherId() {
        return mockPublisherId
      },
      slots: {
        'header-leaderboard': 'slot-header',
        'in-content': 'slot-in-content',
        sidebar: 'slot-sidebar',
        footer: '',
      },
    },
  },
}))

const { AdSenseSlot } = await import('./AdSenseProvider')

type Window_ = typeof window & {
  adsbygoogle?: unknown[] & { requestNonPersonalizedAds?: number }
}

describe('AdSenseSlot', () => {
  beforeEach(() => {
    delete (window as Window_).adsbygoogle
    mockPublisherId = 'ca-pub-1234567890123456'
  })

  it('renders nothing when the placement has no configured ad unit id', () => {
    const { container } = render(<AdSenseSlot placement="footer" personalization="personalized" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when the publisher id is missing', () => {
    mockPublisherId = undefined
    const { container } = render(
      <AdSenseSlot placement="header-leaderboard" personalization="personalized" />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders an <ins class="adsbygoogle"> with the configured client and slot ids', () => {
    const { container } = render(
      <AdSenseSlot placement="header-leaderboard" personalization="personalized" />,
    )
    const ins = container.querySelector('ins.adsbygoogle')
    expect(ins).not.toBeNull()
    expect(ins).toHaveAttribute('data-ad-client', 'ca-pub-1234567890123456')
    expect(ins).toHaveAttribute('data-ad-slot', 'slot-header')
  })

  it('pushes to window.adsbygoogle exactly once on mount', () => {
    const push = vi.fn()
    ;(window as Window_).adsbygoogle = Object.assign([], { push }) as never
    render(<AdSenseSlot placement="header-leaderboard" personalization="personalized" />)
    expect(push).toHaveBeenCalledTimes(1)
    expect(push).toHaveBeenCalledWith({})
  })

  it('does not throw when pushing to adsbygoogle fails', () => {
    ;(window as Window_).adsbygoogle = Object.assign([], {
      push: () => {
        throw new Error('adsbygoogle not ready')
      },
    }) as never
    expect(() =>
      render(<AdSenseSlot placement="header-leaderboard" personalization="personalized" />),
    ).not.toThrow()
  })

  it('gives the wrapper a full-width class so it can measure a non-zero width inside a flex container (BLO-191)', () => {
    const { container } = render(
      <AdSenseSlot placement="header-leaderboard" personalization="personalized" />,
    )
    expect(container.firstElementChild).toHaveClass('w-full')
  })

  it('merges a caller-provided className with the width class instead of replacing it', () => {
    const { container } = render(
      <AdSenseSlot placement="sidebar" className="not-prose my-6" personalization="personalized" />,
    )
    expect(container.firstElementChild).toHaveClass('w-full', 'my-6', 'not-prose')
  })

  it('reserves the smallest configured height and largest configured width to reduce CLS (BLO-134)', () => {
    const { container } = render(
      <AdSenseSlot placement="header-leaderboard" personalization="personalized" />,
    )
    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper.style.minHeight).toBe('90px')
    expect(wrapper.style.maxWidth).toBe('970px')
    expect(wrapper.style.marginInline).toBe('auto')
  })

  it('reserves a different box for a placement with a different size list', () => {
    const { container } = render(<AdSenseSlot placement="sidebar" personalization="personalized" />)
    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper.style.minHeight).toBe('250px')
    expect(wrapper.style.maxWidth).toBe('300px')
  })

  it('sets requestNonPersonalizedAds=1 on the adsbygoogle queue before pushing when non-personalized (BLO-193)', () => {
    render(<AdSenseSlot placement="header-leaderboard" personalization="non-personalized" />)
    expect((window as Window_).adsbygoogle?.requestNonPersonalizedAds).toBe(1)
  })

  it('sets requestNonPersonalizedAds=0 on the adsbygoogle queue before pushing when personalized (BLO-193)', () => {
    render(<AdSenseSlot placement="header-leaderboard" personalization="personalized" />)
    expect((window as Window_).adsbygoogle?.requestNonPersonalizedAds).toBe(0)
  })

  it('updates the flag but does not push a second time when personalization changes after mount (BLO-193)', () => {
    // Regression: useConsent() renders once with the SSR-safe null snapshot
    // (-> 'non-personalized') before correcting to the real client value
    // right after hydration. A naive "capture personalization once at
    // mount" implementation would freeze the wrong value here; the fix
    // must update the flag on every change while still pushing exactly
    // once.
    const { rerender } = render(
      <AdSenseSlot placement="header-leaderboard" personalization="non-personalized" />,
    )
    expect((window as Window_).adsbygoogle?.requestNonPersonalizedAds).toBe(1)
    expect((window as Window_).adsbygoogle?.length).toBe(1)

    rerender(<AdSenseSlot placement="header-leaderboard" personalization="personalized" />)
    expect((window as Window_).adsbygoogle?.requestNonPersonalizedAds).toBe(0)
    expect((window as Window_).adsbygoogle?.length).toBe(1)
  })
})
