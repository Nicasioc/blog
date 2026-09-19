import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'

// AdSlot resolves AD_PLACEMENTS from the real siteConfig singleton, which
// throws on import without a full clientEnv parse under Vitest — mock it the
// same way adConfig.test.ts does. renderSlot itself is mocked at the
// AdProvider boundary so this file only exercises AdSlot's own fallback
// decision, not AdSenseSlot's rendering (covered in its own test file) — the
// stub below mimics AdSenseSlot's real null-guard for unconfigured slots.
vi.mock('@/lib/siteConfig', () => ({
  siteConfig: {
    ads: {
      provider: 'adsense',
      adSensePublisherId: 'ca-pub-1234567890123456',
      slots: {
        'header-leaderboard': 'slot-header',
        'in-content': 'slot-in-content',
        sidebar: 'slot-sidebar',
        footer: 'slot-footer',
        'mobile-banner': '',
      },
    },
  },
}))

const renderSlot = vi.fn((placement: string) =>
  placement === 'mobile-banner' ? null : <div data-testid="rendered" data-placement={placement} />,
)

vi.mock('./AdProvider', () => ({
  useAdProvider: () => ({ renderSlot }),
}))

const { AdSlot } = await import('./AdSlot')

describe('AdSlot', () => {
  it('renders the primary placement when its slot id is configured', () => {
    const { getByTestId } = render(
      <AdSlot placement="header-leaderboard" fallbackPlacement="mobile-banner" />,
    )
    expect(getByTestId('rendered')).toHaveAttribute('data-placement', 'header-leaderboard')
  })

  it('renders the fallback placement when the primary slot id is empty', () => {
    const { getByTestId } = render(
      <AdSlot placement="mobile-banner" fallbackPlacement="header-leaderboard" />,
    )
    expect(getByTestId('rendered')).toHaveAttribute('data-placement', 'header-leaderboard')
  })

  it('renders nothing when the primary is unconfigured and there is no fallback', () => {
    const { container } = render(<AdSlot placement="mobile-banner" />)
    expect(container).toBeEmptyDOMElement()
  })
})
