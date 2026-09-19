import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'

// AdSenseSlot resolves AD_PLACEMENTS from the real siteConfig singleton,
// which throws on import without a full clientEnv parse under Vitest — mock
// it the same way adConfig.test.ts does.
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
      },
    },
  },
}))

const { AdSenseSlot } = await import('./AdSenseProvider')

describe('AdSenseSlot', () => {
  it('gives the wrapper a full-width class so it can measure a non-zero width inside a flex container (BLO-191)', () => {
    const { container } = render(<AdSenseSlot placement="header-leaderboard" />)
    expect(container.firstElementChild).toHaveClass('w-full')
  })

  it('merges a caller-provided className with the width class instead of replacing it', () => {
    const { container } = render(<AdSenseSlot placement="sidebar" className="not-prose my-6" />)
    expect(container.firstElementChild).toHaveClass('w-full', 'my-6', 'not-prose')
  })
})
