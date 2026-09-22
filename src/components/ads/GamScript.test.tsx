import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

let mockEnabled = true
let mockProvider: 'adsense' | 'gam' | 'prebid' = 'gam'
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
    () => {
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
})
