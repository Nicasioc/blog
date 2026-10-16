/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'

vi.mock('@/lib/siteConfig', () => ({
  siteConfig: { siteName: 'Site', siteUrl: 'https://example.com' },
}))

import { CollectionJsonLd } from './CollectionJsonLd'

const MALICIOUS = 'x</script><b>y'

describe('CollectionJsonLd', () => {
  it('escapes < in category and post fields so they cannot close the script tag', () => {
    const category = { name: MALICIOUS, slug: 'cat', description: MALICIOUS } as any
    const posts = [{ title: MALICIOUS, slug: 'p', canonicalUrl: 'https://example.com/p' }] as any

    const { container } = render(
      <CollectionJsonLd category={category} posts={posts} page={1} perPage={10} />,
    )

    const raw = container.querySelector('script[type="application/ld+json"]')?.innerHTML ?? ''
    expect(raw).not.toContain('<')
    const parsed = JSON.parse(raw)
    expect(parsed.name).toBe(MALICIOUS)
    expect(parsed.description).toBe(MALICIOUS)
  })
})
