import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

let mockEnabled = true
let mockStatus: 'accepted' | 'rejected' | null = 'accepted'
let mockProvider: 'adsense' | 'gam' = 'adsense'

vi.mock('@/lib/siteConfig', () => ({
  siteConfig: {
    ads: {
      get enabled() {
        return mockEnabled
      },
      get provider() {
        return mockProvider
      },
    },
  },
}))

vi.mock('@/components/consent/ConsentContext', () => ({
  useConsent: () => ({ status: mockStatus }),
}))

vi.mock('./providers/AdSenseProvider', () => ({
  AdSenseSlot: ({ placement, personalization }: { placement: string; personalization: string }) => (
    <div
      data-testid="adsense-slot"
      data-placement={placement}
      data-personalization={personalization}
    />
  ),
}))

vi.mock('./providers/GamProvider', () => ({
  GamSlot: ({ placement }: { placement: string }) => (
    <div data-testid="gam-slot" data-placement={placement} />
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
    mockProvider = 'adsense'
  })

  it('renders the active provider slot, personalized, when ads are enabled and consent is accepted', () => {
    render(
      <AdProvider>
        <Probe />
      </AdProvider>,
    )
    const slot = screen.getByTestId('adsense-slot')
    expect(slot).toHaveAttribute('data-placement', 'header-leaderboard')
    expect(slot).toHaveAttribute('data-personalization', 'personalized')
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

  it('still renders the slot, non-personalized, when consent is rejected (BLO-193)', () => {
    mockStatus = 'rejected'
    render(
      <AdProvider>
        <Probe />
      </AdProvider>,
    )
    expect(screen.getByTestId('adsense-slot')).toHaveAttribute(
      'data-personalization',
      'non-personalized',
    )
  })

  it('still renders the slot, non-personalized, when consent is unanswered / null (BLO-193)', () => {
    mockStatus = null
    render(
      <AdProvider>
        <Probe />
      </AdProvider>,
    )
    expect(screen.getByTestId('adsense-slot')).toHaveAttribute(
      'data-personalization',
      'non-personalized',
    )
  })

  it('renders the GAM slot, not the AdSense one, when the provider is gam (BLO-140)', () => {
    mockProvider = 'gam'
    render(
      <AdProvider>
        <Probe />
      </AdProvider>,
    )
    const slot = screen.getByTestId('gam-slot')
    expect(slot).toHaveAttribute('data-placement', 'header-leaderboard')
    expect(screen.queryByTestId('adsense-slot')).not.toBeInTheDocument()
  })

  it('renders no GAM slot when ads are disabled (BLO-135)', () => {
    mockProvider = 'gam'
    mockEnabled = false
    render(
      <AdProvider>
        <Probe />
      </AdProvider>,
    )
    expect(screen.queryByTestId('gam-slot')).not.toBeInTheDocument()
  })

  it('renders nothing for an unknown provider value', () => {
    mockProvider = 'unknown' as 'adsense'
    render(
      <AdProvider>
        <Probe />
      </AdProvider>,
    )
    expect(screen.queryByTestId('adsense-slot')).not.toBeInTheDocument()
    expect(screen.queryByTestId('gam-slot')).not.toBeInTheDocument()
  })
})
