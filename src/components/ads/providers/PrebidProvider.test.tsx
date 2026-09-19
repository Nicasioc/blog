import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'

// PrebidSlot resolves AD_PLACEMENTS from the real siteConfig singleton,
// which throws on import without a full clientEnv parse under Vitest — mock
// it the same way AdSenseProvider.test.tsx does.
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

const { PrebidSlot } = await import('./PrebidProvider')

describe('PrebidSlot', () => {
  it('gives the wrapper a full-width class so it can measure a non-zero width inside a flex container (BLO-191)', () => {
    const { container } = render(<PrebidSlot placement="footer" />)
    expect(container.firstElementChild).toHaveClass('w-full')
  })

  it('reserves the smallest configured height and largest configured width to reduce CLS (BLO-134)', () => {
    const { container } = render(<PrebidSlot placement="header-leaderboard" />)
    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper.style.minHeight).toBe('90px')
    expect(wrapper.style.maxWidth).toBe('970px')
    expect(wrapper.style.marginInline).toBe('auto')
  })
})
