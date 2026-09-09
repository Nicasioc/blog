import { describe, it, expect } from 'vitest'
import { buildCollectionPageJsonLd } from '@/domain/seo/buildCollectionPageJsonLd'
import type { Category } from '@/domain/category/category.model'
import type { Post } from '@/domain/post/post.model'

const category = (overrides: Partial<Category> = {}): Category => ({
  id: 1,
  slug: 'plantel',
  name: 'Plantel',
  description: 'Todo sobre el plantel.',
  postCount: 0,
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
})

const post = (id: number): Post =>
  ({ id, slug: `post-${id}`, canonicalUrl: `https://site.example.com/blog/post-${id}` }) as Post

const params = {
  siteUrl: 'https://site.example.com',
  siteName: 'Site',
  perPage: 10,
}

describe('buildCollectionPageJsonLd', () => {
  it('builds a CollectionPage wrapping an ItemList of the page posts', () => {
    const jsonLd = buildCollectionPageJsonLd({
      ...params,
      category: category(),
      posts: [post(1), post(2), post(3)],
      page: 1,
    })

    expect(jsonLd).toEqual({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Plantel',
      url: 'https://site.example.com/category/plantel',
      isPartOf: { '@type': 'WebSite', name: 'Site', url: 'https://site.example.com' },
      description: 'Todo sobre el plantel.',
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: 3,
        itemListElement: [
          { '@type': 'ListItem', position: 1, url: 'https://site.example.com/blog/post-1' },
          { '@type': 'ListItem', position: 2, url: 'https://site.example.com/blog/post-2' },
          { '@type': 'ListItem', position: 3, url: 'https://site.example.com/blog/post-3' },
        ],
      },
    })
  })

  it('handles an empty post list without crashing', () => {
    const jsonLd = buildCollectionPageJsonLd({
      ...params,
      category: category(),
      posts: [],
      page: 1,
    })

    expect(jsonLd.mainEntity.numberOfItems).toBe(0)
    expect(jsonLd.mainEntity.itemListElement).toEqual([])
  })

  it('makes the URL page-aware and continues positions across pages', () => {
    const jsonLd = buildCollectionPageJsonLd({
      ...params,
      category: category(),
      posts: [post(11), post(12)],
      page: 2,
    })

    expect(jsonLd.url).toBe('https://site.example.com/category/plantel?page=2')
    expect(jsonLd.mainEntity.itemListElement.map((i) => i.position)).toEqual([11, 12])
  })

  it('omits description entirely when the category has none', () => {
    const jsonLd = buildCollectionPageJsonLd({
      ...params,
      category: category({ description: '' }),
      posts: [post(1)],
      page: 1,
    })

    expect('description' in jsonLd).toBe(false)
  })

  it('falls back to a derived post URL when canonicalUrl is missing', () => {
    const jsonLd = buildCollectionPageJsonLd({
      ...params,
      category: category(),
      posts: [{ id: 5, slug: 'no-canonical' } as Post],
      page: 1,
    })

    expect(jsonLd.mainEntity.itemListElement[0].url).toBe(
      'https://site.example.com/blog/no-canonical',
    )
  })
})
