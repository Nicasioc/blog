import { describe, it, expect } from 'vitest'
import { mapWpPostToPost } from '@/persistence/wordpress/mappers/postMapper'
import type { WpPostDto } from '@/persistence/wordpress/types/wpPost.dto'

const SITE_URL = 'https://testfc.com'

const baseDto: WpPostDto = {
  id: 1,
  slug: 'test-post',
  status: 'publish',
  date_gmt: '2024-01-01T10:00:00',
  modified_gmt: '2024-01-02T10:00:00',
  title: { rendered: 'Test Post' },
  excerpt: { rendered: '<p>This is the excerpt.</p>' },
  content: { rendered: '<p>Content here</p>' },
  featured_media: 0,
  author: 1,
  categories: [2],
  tags: [3],
  link: 'https://wp.example.com/test-post',
  _embedded: {
    author: [
      {
        id: 1,
        slug: 'author',
        name: 'John Doe',
        description: 'Bio',
        link: 'https://wp.example.com/author/john',
        avatar_urls: { '96': 'https://gravatar.com/96.jpg' },
      },
    ],
    'wp:term': [
      [{ id: 2, slug: 'football', name: 'Football', description: '', count: 10, link: '' }],
      [{ id: 3, slug: 'champions', name: 'Champions', description: '', count: 5, link: '' }],
    ],
  },
}

describe('mapWpPostToPost', () => {
  it('strips HTML from excerpt', () => {
    const post = mapWpPostToPost(baseDto, SITE_URL)
    expect(post.excerpt).toBe('This is the excerpt.')
  })

  it('builds canonical URL from siteUrl + slug', () => {
    const post = mapWpPostToPost(baseDto, SITE_URL)
    expect(post.canonicalUrl).toBe('https://testfc.com/blog/test-post')
  })

  it('parses date_gmt as UTC Date', () => {
    const post = mapWpPostToPost(baseDto, SITE_URL)
    expect(post.publishedAt.toISOString()).toBe('2024-01-01T10:00:00.000Z')
  })

  it('maps embedded author correctly', () => {
    const post = mapWpPostToPost(baseDto, SITE_URL)
    expect(post.author.name).toBe('John Doe')
    expect(post.author.avatarUrl).toBe('https://gravatar.com/96.jpg')
  })

  it('maps embedded categories from wp:term[0]', () => {
    const post = mapWpPostToPost(baseDto, SITE_URL)
    expect(post.categories).toHaveLength(1)
    expect(post.categories[0].slug).toBe('football')
  })

  it('maps embedded tags from wp:term[1]', () => {
    const post = mapWpPostToPost(baseDto, SITE_URL)
    expect(post.tags).toHaveLength(1)
    expect(post.tags[0].slug).toBe('champions')
  })

  it('returns null featuredImage when featured_media is 0', () => {
    const post = mapWpPostToPost(baseDto, SITE_URL)
    expect(post.featuredImage).toBeNull()
  })

  it('maps featuredImage from embedded media', () => {
    const dto: WpPostDto = {
      ...baseDto,
      featured_media: 10,
      _embedded: {
        ...baseDto._embedded,
        'wp:featuredmedia': [
          {
            id: 10,
            source_url: 'https://example.com/full.jpg',
            alt_text: 'A photo',
            media_details: {
              width: 1920,
              height: 1080,
              sizes: {
                large: { source_url: 'https://example.com/large.jpg', width: 1024, height: 576 },
              },
            },
          },
        ],
      },
    }
    const post = mapWpPostToPost(dto, SITE_URL)
    expect(post.featuredImage?.url).toBe('https://example.com/large.jpg')
    expect(post.featuredImage?.width).toBe(1024)
  })

  it('returns null seo when yoast_head_json is absent', () => {
    const post = mapWpPostToPost(baseDto, SITE_URL)
    expect(post.seo).toBeNull()
  })

  it('maps Yoast SEO fields when present', () => {
    const dto: WpPostDto = {
      ...baseDto,
      yoast_head_json: {
        title: 'Yoast Title',
        description: 'Yoast Desc',
        og_image: [{ url: 'https://example.com/og.jpg' }],
      },
    }
    const post = mapWpPostToPost(dto, SITE_URL)
    expect(post.seo?.metaTitle).toBe('Yoast Title')
    expect(post.seo?.ogImage).toBe('https://example.com/og.jpg')
  })

  it('returns empty categories and tags when _embedded is absent', () => {
    const dto: WpPostDto = { ...baseDto, _embedded: undefined }
    const post = mapWpPostToPost(dto, SITE_URL)
    expect(post.categories).toEqual([])
    expect(post.tags).toEqual([])
  })
})
