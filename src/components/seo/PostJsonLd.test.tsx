/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'

vi.mock('@/lib/siteConfig', () => ({
  siteConfig: { siteName: 'Site', siteUrl: 'https://example.com' },
}))

import { PostJsonLd } from './PostJsonLd'

const MALICIOUS = 'x</script><b>y'

describe('PostJsonLd', () => {
  it('escapes < in CMS-controlled fields so they cannot close the script tag', () => {
    const post = {
      title: MALICIOUS,
      excerpt: MALICIOUS,
      publishedAt: new Date('2026-01-01T00:00:00Z'),
      modifiedAt: new Date('2026-01-02T00:00:00Z'),
      author: { name: MALICIOUS },
      featuredImage: null,
      canonicalUrl: 'https://example.com/blog/a',
    } as any

    const { container } = render(<PostJsonLd post={post} />)

    const raw = container.querySelector('script[type="application/ld+json"]')?.innerHTML ?? ''
    expect(raw).not.toContain('<')
    const parsed = JSON.parse(raw)
    expect(parsed.headline).toBe(MALICIOUS)
    expect(parsed.author.name).toBe(MALICIOUS)
  })
})
