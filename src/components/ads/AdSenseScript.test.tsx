import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

let mockEnabled = true
let mockProvider: 'adsense' | 'gam' | 'prebid' = 'adsense'
let mockPublisherId: string | undefined = 'ca-pub-1234567890123456'

vi.mock('@/lib/siteConfig', () => ({
  siteConfig: {
    ads: {
      get enabled() {
        return mockEnabled
      },
      get provider() {
        return mockProvider
      },
      get adSensePublisherId() {
        return mockPublisherId
      },
    },
  },
}))

vi.mock('next/script', () => ({
  default: (props: Record<string, unknown>) => <script data-testid="adsense-script" {...props} />,
}))

const { AdSenseScript } = await import('./AdSenseScript')

describe('AdSenseScript', () => {
  beforeEach(() => {
    mockEnabled = true
    mockProvider = 'adsense'
    mockPublisherId = 'ca-pub-1234567890123456'
  })

  it('renders the script with the publisher id in the src', () => {
    render(<AdSenseScript />)
    const script = screen.getByTestId('adsense-script')
    expect(script).toHaveAttribute('src', expect.stringContaining('client=ca-pub-1234567890123456'))
  })

  it.each(['rejected', null] as const)(
    'still renders regardless of consent status (%s) — consent only gates personalization (BLO-193)',
    () => {
      render(<AdSenseScript />)
      expect(screen.getByTestId('adsense-script')).toBeInTheDocument()
    },
  )

  it('renders nothing when ads are disabled (BLO-135)', () => {
    mockEnabled = false
    render(<AdSenseScript />)
    expect(screen.queryByTestId('adsense-script')).not.toBeInTheDocument()
  })

  it('renders nothing when the provider is not adsense', () => {
    mockProvider = 'gam'
    render(<AdSenseScript />)
    expect(screen.queryByTestId('adsense-script')).not.toBeInTheDocument()
  })

  it('renders nothing when the publisher id is missing', () => {
    mockPublisherId = undefined
    render(<AdSenseScript />)
    expect(screen.queryByTestId('adsense-script')).not.toBeInTheDocument()
  })
})
