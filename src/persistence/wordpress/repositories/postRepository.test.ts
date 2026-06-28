import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/env.server', () => ({
  serverEnv: {
    WORDPRESS_API_URL: 'https://test.example.com/wp-json',
    REVALIDATE_POSTS: 3600,
    REVALIDATE_PAGES: 86400,
    WORDPRESS_CATEGORY_ID: undefined,
    WORDPRESS_TAG_ID: undefined,
  },
}))

vi.mock('@/lib/env.client', () => ({
  clientEnv: { NEXT_PUBLIC_SITE_URL: 'https://site.example.com' },
}))

vi.mock('@/persistence/wordpress/wpClient', () => ({ wpFetch: vi.fn() }))

vi.mock('@/persistence/wordpress/mappers/postMapper', () => ({
  mapWpPostToPost: vi.fn((dto: { slug: string }) => ({ slug: dto.slug })),
}))

import { serverEnv } from '@/lib/env.server'
import { wpFetch } from '@/persistence/wordpress/wpClient'
import { fetchPostsList, fetchAllPostSlugs } from './postRepository'

const makeWpResponse = (data: unknown[], totalItems = 1, totalPages = 1) => ({
  data,
  totalItems,
  totalPages,
})

describe('fetchPostsList', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uses no scope filters when env vars are not set', async () => {
    vi.mocked(wpFetch).mockResolvedValue(makeWpResponse([]))
    await fetchPostsList()
    expect(wpFetch).toHaveBeenCalledWith(
      '/wp/v2/posts',
      expect.objectContaining({
        params: expect.objectContaining({ categories: undefined, tags: undefined }),
      }),
    )
  })

  it('applies WORDPRESS_CATEGORY_ID as default categoryId', async () => {
    vi.mocked(serverEnv).WORDPRESS_CATEGORY_ID = 5
    vi.mocked(wpFetch).mockResolvedValue(makeWpResponse([]))
    await fetchPostsList()
    expect(wpFetch).toHaveBeenCalledWith(
      '/wp/v2/posts',
      expect.objectContaining({
        params: expect.objectContaining({ categories: 5 }),
      }),
    )
    vi.mocked(serverEnv).WORDPRESS_CATEGORY_ID = undefined
  })

  it('applies WORDPRESS_TAG_ID as default tagId', async () => {
    vi.mocked(serverEnv).WORDPRESS_TAG_ID = 7
    vi.mocked(wpFetch).mockResolvedValue(makeWpResponse([]))
    await fetchPostsList()
    expect(wpFetch).toHaveBeenCalledWith(
      '/wp/v2/posts',
      expect.objectContaining({
        params: expect.objectContaining({ tags: 7 }),
      }),
    )
    vi.mocked(serverEnv).WORDPRESS_TAG_ID = undefined
  })

  it('caller-provided categoryId overrides WORDPRESS_CATEGORY_ID', async () => {
    vi.mocked(serverEnv).WORDPRESS_CATEGORY_ID = 5
    vi.mocked(wpFetch).mockResolvedValue(makeWpResponse([]))
    await fetchPostsList({ categoryId: 10 })
    expect(wpFetch).toHaveBeenCalledWith(
      '/wp/v2/posts',
      expect.objectContaining({
        params: expect.objectContaining({ categories: 10 }),
      }),
    )
    vi.mocked(serverEnv).WORDPRESS_CATEGORY_ID = undefined
  })

  it('caller-provided tagId overrides WORDPRESS_TAG_ID', async () => {
    vi.mocked(serverEnv).WORDPRESS_TAG_ID = 7
    vi.mocked(wpFetch).mockResolvedValue(makeWpResponse([]))
    await fetchPostsList({ tagId: 3 })
    expect(wpFetch).toHaveBeenCalledWith(
      '/wp/v2/posts',
      expect.objectContaining({
        params: expect.objectContaining({ tags: 3 }),
      }),
    )
    vi.mocked(serverEnv).WORDPRESS_TAG_ID = undefined
  })
})

describe('fetchAllPostSlugs', () => {
  beforeEach(() => vi.clearAllMocks())

  it('applies WORDPRESS_CATEGORY_ID scope to slug fetch', async () => {
    vi.mocked(serverEnv).WORDPRESS_CATEGORY_ID = 5
    vi.mocked(wpFetch).mockResolvedValue(makeWpResponse([{ slug: 'post-1' }]))
    await fetchAllPostSlugs()
    expect(wpFetch).toHaveBeenCalledWith(
      '/wp/v2/posts',
      expect.objectContaining({
        params: expect.objectContaining({ categories: 5 }),
      }),
    )
    vi.mocked(serverEnv).WORDPRESS_CATEGORY_ID = undefined
  })

  it('applies WORDPRESS_TAG_ID scope to slug fetch', async () => {
    vi.mocked(serverEnv).WORDPRESS_TAG_ID = 7
    vi.mocked(wpFetch).mockResolvedValue(makeWpResponse([{ slug: 'post-1' }]))
    await fetchAllPostSlugs()
    expect(wpFetch).toHaveBeenCalledWith(
      '/wp/v2/posts',
      expect.objectContaining({
        params: expect.objectContaining({ tags: 7 }),
      }),
    )
    vi.mocked(serverEnv).WORDPRESS_TAG_ID = undefined
  })

  it('applies scope to all paginated fetches', async () => {
    vi.mocked(serverEnv).WORDPRESS_CATEGORY_ID = 5
    vi.mocked(wpFetch)
      .mockResolvedValueOnce(makeWpResponse([{ slug: 'post-1' }], 2, 2))
      .mockResolvedValueOnce(makeWpResponse([{ slug: 'post-2' }], 2, 2))
    await fetchAllPostSlugs()
    expect(wpFetch).toHaveBeenCalledTimes(2)
    for (const call of vi.mocked(wpFetch).mock.calls) {
      expect(call[1]).toEqual(
        expect.objectContaining({
          params: expect.objectContaining({ categories: 5 }),
        }),
      )
    }
    vi.mocked(serverEnv).WORDPRESS_CATEGORY_ID = undefined
  })
})
