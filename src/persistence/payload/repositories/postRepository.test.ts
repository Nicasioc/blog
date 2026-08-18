import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/env.server', () => ({
  serverEnv: { REVALIDATE_POSTS: 3600, REVALIDATE_PAGES: 86400 },
}))

vi.mock('@/lib/env.client', () => ({
  clientEnv: { NEXT_PUBLIC_SITE_URL: 'https://site.example.com' },
}))

vi.mock('@/persistence/payload/payloadClient', () => ({ payloadFetch: vi.fn() }))
vi.mock('@/persistence/payload/payloadWriteClient', () => ({ payloadMutate: vi.fn() }))
vi.mock('@/persistence/payload/mappers/postMapper', () => ({
  mapPayloadPostToPost: vi.fn((dto: { slug: string }) => ({ slug: dto.slug })),
}))

import { payloadFetch } from '@/persistence/payload/payloadClient'
import { payloadMutate } from '@/persistence/payload/payloadWriteClient'
import {
  fetchPostsList,
  fetchPostBySlug,
  fetchRelatedPosts,
  fetchAllPostSlugs,
  createPost,
} from './postRepository'

const makeResult = (data: unknown[], totalItems = data.length, totalPages = 1) => ({
  data,
  totalItems,
  totalPages,
})

describe('fetchPostsList', () => {
  beforeEach(() => vi.clearAllMocks())

  it('scopes to published posts with no filters by default', async () => {
    vi.mocked(payloadFetch).mockResolvedValue(makeResult([]))

    await fetchPostsList()

    expect(payloadFetch).toHaveBeenCalledWith(
      '/posts',
      expect.objectContaining({
        where: { _status: { equals: 'published' } },
        page: 1,
        limit: 10,
        sort: '-publishedAt',
      }),
    )
  })

  it('filters by categoryId when provided (category archive pages)', async () => {
    vi.mocked(payloadFetch).mockResolvedValue(makeResult([]))

    await fetchPostsList({ categoryId: 5 })

    expect(payloadFetch).toHaveBeenCalledWith(
      '/posts',
      expect.objectContaining({
        where: { _status: { equals: 'published' }, categories: { in: '5' } },
      }),
    )
  })

  it('filters by tagId when provided (tag archive pages)', async () => {
    vi.mocked(payloadFetch).mockResolvedValue(makeResult([]))

    await fetchPostsList({ tagId: 7 })

    expect(payloadFetch).toHaveBeenCalledWith(
      '/posts',
      expect.objectContaining({
        where: { _status: { equals: 'published' }, tags: { in: '7' } },
      }),
    )
  })

  it('maps and returns pagination metadata', async () => {
    vi.mocked(payloadFetch).mockResolvedValue(makeResult([{ slug: 'a' }], 25, 3))

    const result = await fetchPostsList()

    expect(result).toEqual({ posts: [{ slug: 'a' }], totalItems: 25, totalPages: 3 })
  })
})

describe('fetchPostBySlug', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns the mapped post when found', async () => {
    vi.mocked(payloadFetch).mockResolvedValue(makeResult([{ slug: 'foo' }]))
    expect(await fetchPostBySlug('foo')).toEqual({ slug: 'foo' })
  })

  it('returns null when not found', async () => {
    vi.mocked(payloadFetch).mockResolvedValue(makeResult([]))
    expect(await fetchPostBySlug('missing')).toBeNull()
  })
})

describe('fetchRelatedPosts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns an empty array without calling payloadFetch when categoryIds is empty', async () => {
    const posts = await fetchRelatedPosts([], 1)
    expect(posts).toEqual([])
    expect(payloadFetch).not.toHaveBeenCalled()
  })

  it('excludes the current post and filters by category ids', async () => {
    vi.mocked(payloadFetch).mockResolvedValue(makeResult([{ slug: 'related' }]))

    await fetchRelatedPosts([2, 3], 1)

    expect(payloadFetch).toHaveBeenCalledWith(
      '/posts',
      expect.objectContaining({
        where: {
          categories: { in: '2,3' },
          id: { not_equals: 1 },
          _status: { equals: 'published' },
        },
        limit: 3,
        sort: '-publishedAt',
      }),
    )
  })
})

describe('fetchAllPostSlugs', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns slugs from a single page', async () => {
    vi.mocked(payloadFetch).mockResolvedValue(makeResult([{ slug: 'a' }, { slug: 'b' }], 2, 1))

    const slugs = await fetchAllPostSlugs()

    expect(slugs).toEqual([{ slug: 'a' }, { slug: 'b' }])
    expect(payloadFetch).toHaveBeenCalledTimes(1)
  })

  it('fans out across remaining pages and flattens the results', async () => {
    vi.mocked(payloadFetch)
      .mockResolvedValueOnce(makeResult([{ slug: 'a' }], 3, 3))
      .mockResolvedValueOnce(makeResult([{ slug: 'b' }], 3, 3))
      .mockResolvedValueOnce(makeResult([{ slug: 'c' }], 3, 3))

    const slugs = await fetchAllPostSlugs()

    expect(slugs).toEqual([{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }])
    expect(payloadFetch).toHaveBeenCalledTimes(3)
  })
})

describe('createPost', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sends the write DTO to payloadMutate and maps the result', async () => {
    vi.mocked(payloadMutate).mockResolvedValue({ slug: 'new-post' })

    const input = {
      title: 'New Post',
      content: {},
      _status: 'draft' as const,
      author: 1,
      categories: [2],
      tags: [3],
    }
    const post = await createPost(input)

    expect(payloadMutate).toHaveBeenCalledWith('/posts', { method: 'POST', body: input })
    expect(post).toEqual({ slug: 'new-post' })
  })
})
