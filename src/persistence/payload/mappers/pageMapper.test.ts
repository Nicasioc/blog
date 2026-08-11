import { describe, it, expect } from 'vitest'
import { mapPayloadPageToPage } from '@/persistence/payload/mappers/pageMapper'
import type { PayloadPageDto } from '@/persistence/payload/types/payloadPage.dto'

const baseDto: PayloadPageDto = {
  id: 1,
  slug: 'about-us',
  title: 'About Us',
  contentHtml: '<p>We are a soccer blog.</p>',
  updatedAt: '2024-01-02T10:00:00.000Z',
  _status: 'published',
}

describe('mapPayloadPageToPage', () => {
  it('maps basic fields, reading content from contentHtml', () => {
    const page = mapPayloadPageToPage(baseDto)
    expect(page).toMatchObject({
      id: 1,
      slug: 'about-us',
      title: 'About Us',
      content: '<p>We are a soccer blog.</p>',
    })
  })

  it('parses updatedAt as a Date', () => {
    const page = mapPayloadPageToPage(baseDto)
    expect(page.modifiedAt.toISOString()).toBe('2024-01-02T10:00:00.000Z')
  })

  it('returns null seo when meta title and description are absent', () => {
    const page = mapPayloadPageToPage(baseDto)
    expect(page.seo).toBeNull()
  })

  it('maps meta fields when present', () => {
    const page = mapPayloadPageToPage({
      ...baseDto,
      meta: {
        title: 'Meta Title',
        description: 'Meta Desc',
        image: { id: 9, alt: '', url: 'https://example.com/og.jpg' },
      },
    })
    expect(page.seo).toEqual({
      metaTitle: 'Meta Title',
      metaDescription: 'Meta Desc',
      ogImage: 'https://example.com/og.jpg',
    })
  })

  it('returns null ogImage when meta.image is an unpopulated id', () => {
    const page = mapPayloadPageToPage({
      ...baseDto,
      meta: { title: 'Meta Title', image: 9 },
    })
    expect(page.seo?.ogImage).toBeNull()
  })
})
