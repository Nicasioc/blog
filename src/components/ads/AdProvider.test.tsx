import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

let mockEnabled = true
let mockStatus: 'accepted' | 'rejected' | null = 'accepted'

vi.mock('@/lib/siteConfig', () => ({
  siteConfig: {
    ads: {
      get enabled() {
        return mockEnabled
      },
      provider: 'adsense',
    },
  },
}))

vi.mock('@/components/consent/ConsentContext', () => ({
  useConsent: () => ({ status: mockStatus }),
}))

vi.mock('./providers/AdSenseProvider', () => ({
  AdSenseSlot: ({ placement }: { placement: string }) => (
    <div data-testid="adsense-slot" data-placement={placement} />
  ),
}))

const { AdProvider, useAdProvider } = await import('./AdProvider')

const Probe = () => {
  const { renderSlot } = useAdProvider()
  return <>{renderSlot('header-leaderboard')}</>
}

describe('AdProvider', () => {
  beforeEach(() => {
    mockEnabled = true
    mockStatus = 'accepted'
  })

  it('renders the active provider slot when ads are enabled and consent is accepted', () => {
    render(
      <AdProvider>
        <Probe />
      </AdProvider>,
    )
    expect(screen.getByTestId('adsense-slot')).toHaveAttribute(
      'data-placement',
      'header-leaderboard',
    )
  })

  it('renders nothing when siteConfig.ads.enabled is false, even with consent accepted (BLO-135)', () => {
    mockEnabled = false
    render(
      <AdProvider>
        <Probe />
      </AdProvider>,
    )
    expect(screen.queryByTestId('adsense-slot')).not.toBeInTheDocument()
  })

  it('renders nothing when consent is not accepted, regardless of ads.enabled', () => {
    mockStatus = 'rejected'
    render(
      <AdProvider>
        <Probe />
      </AdProvider>,
    )
    expect(screen.queryByTestId('adsense-slot')).not.toBeInTheDocument()
  })
})
