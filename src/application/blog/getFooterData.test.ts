import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getFooterData } from './getFooterData'

vi.mock('@/persistence/payload/repositories/categoryRepository', () => ({
  fetchAllCategories: vi.fn(),
}))
vi.mock('@/persistence/payload/repositories/postRepository', () => ({
  fetchPostsList: vi.fn(),
}))

import { fetchAllCategories } from '@/persistence/payload/repositories/categoryRepository'
import { fetchPostsList } from '@/persistence/payload/repositories/postRepository'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeCategory = (id: number) => ({ id, slug: `c-${id}`, name: `C${id}` }) as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makePost = (id: number) => ({ id, slug: `post-${id}` }) as any

describe('getFooterData', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns all categories and a capped list of recent posts', async () => {
    vi.mocked(fetchAllCategories).mockResolvedValue([makeCategory(1), makeCategory(2)])
    vi.mocked(fetchPostsList).mockResolvedValue({
      posts: [makePost(1), makePost(2), makePost(3)],
      totalItems: 3,
      totalPages: 1,
    })

    const result = await getFooterData()

    expect(result.categories).toHaveLength(2)
    expect(result.recentPosts.map((p) => p.id)).toEqual([1, 2, 3])
    expect(fetchPostsList).toHaveBeenCalledWith({ perPage: 6 })
  })

  it('handles empty content without error', async () => {
    vi.mocked(fetchAllCategories).mockResolvedValue([])
    vi.mocked(fetchPostsList).mockResolvedValue({ posts: [], totalItems: 0, totalPages: 0 })

    const result = await getFooterData()

    expect(result).toEqual({ categories: [], recentPosts: [] })
  })
})
