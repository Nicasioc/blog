import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

let mockEnabled = true
let mockProvider: 'adsense' | 'gam' = 'gam'
let mockNetworkCode: string | undefined = '123456789'

vi.mock('@/lib/siteConfig', () => ({
  siteConfig: {
    ads: {
      get enabled() {
        return mockEnabled
      },
      get provider() {
        return mockProvider
      },
      get gamNetworkCode() {
        return mockNetworkCode
      },
    },
  },
}))

let mockStatus: 'accepted' | 'rejected' | null = 'accepted'

vi.mock('@/components/consent/ConsentContext', () => ({
  useConsent: () => ({ status: mockStatus }),
}))

vi.mock('next/script', () => ({
  default: (props: Record<string, unknown>) => <script data-testid="gpt-script" {...props} />,
}))

// Imported with the mock above already reporting a configured GAM tenant, so
// the module-scope queue init runs on this import — that's the behaviour the
// first test asserts.
const { GamScript } = await import('./GamScript')

type WindowWithGoogletag = Window & { googletag?: { cmd: unknown[] } }

describe('GamScript', () => {
  beforeEach(() => {
    mockEnabled = true
    mockProvider = 'gam'
    mockNetworkCode = '123456789'
    mockStatus = 'accepted'
  })

  it('initialises window.googletag.cmd at import time, before gpt.js is requested', () => {
    expect((window as WindowWithGoogletag).googletag?.cmd).toEqual([])
  })

  it('loads gpt.js when provider, network code and ads.enabled all allow it', () => {
    render(<GamScript />)
    expect(screen.getByTestId('gpt-script')).toHaveAttribute(
      'src',
      'https://securepubads.g.doubleclick.net/tag/js/gpt.js',
    )
  })

  it('loads the tag after hydration rather than blocking it', () => {
    render(<GamScript />)
    expect(screen.getByTestId('gpt-script')).toHaveAttribute('strategy', 'afterInteractive')
  })

  it.each(['rejected', null] as const)(
    'still loads regardless of consent status (%s) — consent only gates personalization (BLO-193)',
    (status) => {
      mockStatus = status
      render(<GamScript />)
      expect(screen.getByTestId('gpt-script')).toBeInTheDocument()
    },
  )

  it('renders nothing when ads are disabled (BLO-135)', () => {
    mockEnabled = false
    render(<GamScript />)
    expect(screen.queryByTestId('gpt-script')).not.toBeInTheDocument()
  })

  it('renders nothing when the provider is not gam', () => {
    mockProvider = 'adsense'
    render(<GamScript />)
    expect(screen.queryByTestId('gpt-script')).not.toBeInTheDocument()
  })

  it('renders nothing when the network code is missing', () => {
    mockNetworkCode = undefined
    render(<GamScript />)
    expect(screen.queryByTestId('gpt-script')).not.toBeInTheDocument()
  })

  it('renders nothing when the network code is an empty string', () => {
    mockNetworkCode = ''
    render(<GamScript />)
    expect(screen.queryByTestId('gpt-script')).not.toBeInTheDocument()
  })

  describe('personalization', () => {
    // A gpt.js-already-loaded googletag: push() runs commands immediately.
    const installLoadedGoogletag = () => {
      const pubads = { setPrivacySettings: vi.fn(), refresh: vi.fn() }
      ;(window as unknown as { googletag: unknown }).googletag = {
        cmd: { push: (...commands: Array<() => void>) => commands.forEach((c) => c()) },
        pubads: () => pubads,
      }
      return pubads
    }

    it.each([
      ['accepted', false],
      ['rejected', true],
      [null, true],
    ] as const)('sets nonPersonalizedAds from consent %s → %s (BLO-193)', (status, expected) => {
      const pubads = installLoadedGoogletag()
      mockStatus = status
      render(<GamScript />)
      expect(pubads.setPrivacySettings).toHaveBeenLastCalledWith({ nonPersonalizedAds: expected })
    })

    it('follows a consent change without remounting', () => {
      const pubads = installLoadedGoogletag()
      mockStatus = null
      const { rerender } = render(<GamScript />)
      mockStatus = 'accepted'
      rerender(<GamScript />)
      expect(pubads.setPrivacySettings).toHaveBeenLastCalledWith({ nonPersonalizedAds: false })
    })

    it('does not touch googletag when GAM is not configured', () => {
      const pubads = installLoadedGoogletag()
      mockProvider = 'adsense'
      render(<GamScript />)
      expect(pubads.setPrivacySettings).not.toHaveBeenCalled()
    })
  })
})
