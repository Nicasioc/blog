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

describe('getHomepageData', () => {
  beforeEach(() => vi.clearAllMocks())

  it('splits first post as featuredPost and rest as recentPosts', async () => {
    const posts = [makePost(1), makePost(2), makePost(3)]
    vi.mocked(fetchPostsList).mockResolvedValue({ posts, totalItems: 3, totalPages: 1 })
    vi.mocked(fetchAllCategories).mockResolvedValue([])

    const data = await getHomepageData()
    expect(data.featuredPost?.id).toBe(1)
    expect(data.recentPosts).toHaveLength(2)
    expect(data.recentPosts[0].id).toBe(2)
  })

  it('returns null featuredPost when no posts exist', async () => {
    vi.mocked(fetchPostsList).mockResolvedValue({ posts: [], totalItems: 0, totalPages: 0 })
    vi.mocked(fetchAllCategories).mockResolvedValue([])

    const data = await getHomepageData()
    expect(data.featuredPost).toBeNull()
    expect(data.recentPosts).toEqual([])
  })
})
