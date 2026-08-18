import { describe, it, expect } from 'vitest'
import { mapPayloadPostToPost } from '@/persistence/payload/mappers/postMapper'
import type { PayloadPostDto } from '@/persistence/payload/types/payloadPost.dto'

const SITE_URL = 'https://testfc.com'

const baseDto: PayloadPostDto = {
  id: 1,
  slug: 'test-post',
  title: 'Test Post',
  excerpt: 'This is the excerpt.',
  contentHtml: '<p>Content here</p>',
  publishedAt: '2024-01-01T10:00:00.000Z',
  author: {
    id: 1,
    slug: 'author',
    name: 'John Doe',
    description: 'Bio',
    avatar: { id: 2, alt: '', url: 'https://example.com/96.jpg' },
  },
  categories: [{ id: 2, slug: 'football', name: 'Football', description: '' }],
  tags: [{ id: 3, slug: 'champions', name: 'Champions', description: '' }],
  updatedAt: '2024-01-02T10:00:00.000Z',
  _status: 'published',
}

describe('mapPayloadPostToPost', () => {
  it('maps content from contentHtml directly', () => {
    const post = mapPayloadPostToPost(baseDto, SITE_URL)
    expect(post.content).toBe('<p>Content here</p>')
  })

  it('builds canonical URL from siteUrl + slug', () => {
    const post = mapPayloadPostToPost(baseDto, SITE_URL)
    expect(post.canonicalUrl).toBe('https://testfc.com/blog/test-post')
  })

  it('parses publishedAt as a Date', () => {
    const post = mapPayloadPostToPost(baseDto, SITE_URL)
    expect(post.publishedAt.toISOString()).toBe('2024-01-01T10:00:00.000Z')
  })

  it('falls back to updatedAt when publishedAt is absent (e.g. drafts)', () => {
    const post = mapPayloadPostToPost({ ...baseDto, publishedAt: undefined }, SITE_URL)
    expect(post.publishedAt.toISOString()).toBe('2024-01-02T10:00:00.000Z')
  })

  it('maps a populated author correctly', () => {
    const post = mapPayloadPostToPost(baseDto, SITE_URL)
    expect(post.author.name).toBe('John Doe')
    expect(post.author.avatarUrl).toBe('https://example.com/96.jpg')
  })

  it('falls back to a placeholder author when author is an unpopulated id', () => {
    const post = mapPayloadPostToPost({ ...baseDto, author: 7 }, SITE_URL)
    expect(post.author).toEqual({
      id: 7,
      slug: '',
      name: 'Desconocido',
      description: '',
      avatarUrl: null,
      profileUrl: '',
    })
  })

  it('maps populated categories and tags', () => {
    const post = mapPayloadPostToPost(baseDto, SITE_URL)
    expect(post.categories).toHaveLength(1)
    expect(post.categories[0].slug).toBe('football')
    expect(post.tags).toHaveLength(1)
    expect(post.tags[0].slug).toBe('champions')
  })

  it('returns empty categories and tags when absent', () => {
    const post = mapPayloadPostToPost(
      { ...baseDto, categories: undefined, tags: undefined },
      SITE_URL,
    )
    expect(post.categories).toEqual([])
    expect(post.tags).toEqual([])
  })

  it('filters out unpopulated (id-only) categories and tags', () => {
    const post = mapPayloadPostToPost({ ...baseDto, categories: [2], tags: [3] }, SITE_URL)
    expect(post.categories).toEqual([])
    expect(post.tags).toEqual([])
  })

  it('returns null featuredImage when absent', () => {
    const post = mapPayloadPostToPost(baseDto, SITE_URL)
    expect(post.featuredImage).toBeNull()
  })

  it('maps featuredImage from a populated media doc', () => {
    const post = mapPayloadPostToPost(
      {
        ...baseDto,
        featuredImage: {
          id: 10,
          alt: 'A photo',
          url: 'https://example.com/full.jpg',
          width: 1920,
          height: 1080,
        },
      },
      SITE_URL,
    )
    expect(post.featuredImage).toEqual({
      url: 'https://example.com/full.jpg',
      alt: 'A photo',
      width: 1920,
      height: 1080,
    })
  })

  it('returns null featuredImage when the media doc has no url', () => {
    const post = mapPayloadPostToPost(
      { ...baseDto, featuredImage: { id: 10, alt: 'A photo' } },
      SITE_URL,
    )
    expect(post.featuredImage).toBeNull()
  })

  it('returns null seo when meta title and description are absent', () => {
    const post = mapPayloadPostToPost(baseDto, SITE_URL)
    expect(post.seo).toBeNull()
  })

  it('maps meta SEO fields when present', () => {
    const post = mapPayloadPostToPost(
      {
        ...baseDto,
        meta: {
          title: 'Meta Title',
          description: 'Meta Desc',
          image: { id: 11, alt: '', url: 'https://example.com/og.jpg' },
        },
      },
      SITE_URL,
    )
    expect(post.seo).toEqual({
      metaTitle: 'Meta Title',
      metaDescription: 'Meta Desc',
      ogImage: 'https://example.com/og.jpg',
    })
  })

  it('falls back to empty excerpt when absent', () => {
    const post = mapPayloadPostToPost({ ...baseDto, excerpt: undefined }, SITE_URL)
    expect(post.excerpt).toBe('')
  })

  it('maps featured true to true', () => {
    const post = mapPayloadPostToPost({ ...baseDto, featured: true }, SITE_URL)
    expect(post.featured).toBe(true)
  })

  it('maps featured false to false', () => {
    const post = mapPayloadPostToPost({ ...baseDto, featured: false }, SITE_URL)
    expect(post.featured).toBe(false)
  })

  it('maps featured undefined to false (posts created before the field existed)', () => {
    const post = mapPayloadPostToPost({ ...baseDto, featured: undefined }, SITE_URL)
    expect(post.featured).toBe(false)
  })

  it('maps featured null to false', () => {
    const post = mapPayloadPostToPost({ ...baseDto, featured: null }, SITE_URL)
    expect(post.featured).toBe(false)
  })
})
