import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getHomepageData } from './getHomepageData'

vi.mock('@/persistence/payload/repositories/postRepository', () => ({
  fetchPostsList: vi.fn(),
}))
vi.mock('@/persistence/payload/repositories/categoryRepository', () => ({
  fetchAllCategories: vi.fn(),
}))

import { fetchPostsList } from '@/persistence/payload/repositories/postRepository'
import { fetchAllCategories } from '@/persistence/payload/repositories/categoryRepository'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makePost = (id: number) => ({ id, slug: `post-${id}` }) as any

// fetchPostsList is called twice (featured query, then the main list) — branch the
// mock on the `featured` param rather than relying on call order.
const mockLists = (featured: unknown[], recent: unknown[]) => {
  vi.mocked(fetchPostsList).mockImplementation(async (params = {}) =>
    params.featured === true
      ? { posts: featured as never[], totalItems: featured.length, totalPages: 1 }
      : { posts: recent as never[], totalItems: recent.length, totalPages: 1 },
  )
}

describe('getHomepageData', () => {
  beforeEach(() => vi.clearAllMocks())

  it('prefers featured posts for the hero, backfilling with recent posts', async () => {
    mockLists([makePost(9)], [makePost(1), makePost(2), makePost(3)])
    vi.mocked(fetchAllCategories).mockResolvedValue([])

    const data = await getHomepageData()

    expect(data.heroPosts.map((post) => post.id)).toEqual([9, 1, 2])
  })

  it('falls back to recent posts entirely when nothing is featured', async () => {
    mockLists([], [makePost(1), makePost(2), makePost(3), makePost(4)])
    vi.mocked(fetchAllCategories).mockResolvedValue([])

    const data = await getHomepageData()

    expect(data.heroPosts.map((post) => post.id)).toEqual([1, 2, 3])
  })

  it('excludes hero posts from recentPosts so nothing renders twice', async () => {
    mockLists([makePost(9)], [makePost(1), makePost(2), makePost(3), makePost(9)])
    vi.mocked(fetchAllCategories).mockResolvedValue([])

    const data = await getHomepageData()

    const heroIds = data.heroPosts.map((post) => post.id)
    const recentIds = data.recentPosts.map((post) => post.id)
    expect(heroIds).toEqual([9, 1, 2])
    expect(recentIds).toEqual([3])
  })

  it('returns empty heroPosts and recentPosts when there are no posts at all', async () => {
    mockLists([], [])
    vi.mocked(fetchAllCategories).mockResolvedValue([])

    const data = await getHomepageData()

    expect(data.heroPosts).toEqual([])
    expect(data.recentPosts).toEqual([])
  })
})
