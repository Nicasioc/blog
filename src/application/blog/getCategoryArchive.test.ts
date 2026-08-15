import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getCategoryArchive } from './getCategoryArchive'

vi.mock('@/persistence/payload/repositories/categoryRepository', () => ({
  fetchCategoryBySlug: vi.fn(),
}))
vi.mock('@/persistence/payload/repositories/postRepository', () => ({
  fetchPostsList: vi.fn(),
}))

import { fetchCategoryBySlug } from '@/persistence/payload/repositories/categoryRepository'
import { fetchPostsList } from '@/persistence/payload/repositories/postRepository'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeCategory = (id: number) => ({ id, slug: `category-${id}`, name: `Category ${id}` }) as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makePost = (id: number) => ({ id, slug: `post-${id}` }) as any

describe('getCategoryArchive', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null when category is not found', async () => {
    vi.mocked(fetchCategoryBySlug).mockResolvedValue(null)
    const result = await getCategoryArchive({ slug: 'unknown' })
    expect(result).toBeNull()
  })

  it('passes category.id as categoryId to fetchPostsList', async () => {
    vi.mocked(fetchCategoryBySlug).mockResolvedValue(makeCategory(3))
    vi.mocked(fetchPostsList).mockResolvedValue({ posts: [], totalItems: 0, totalPages: 0 })
    await getCategoryArchive({ slug: 'football', page: 2, perPage: 5 })
    expect(fetchPostsList).toHaveBeenCalledWith({ categoryId: 3, page: 2, perPage: 5 })
  })

  it('returns assembled category archive data', async () => {
    const category = makeCategory(3)
    const posts = [makePost(1)]
    vi.mocked(fetchCategoryBySlug).mockResolvedValue(category)
    vi.mocked(fetchPostsList).mockResolvedValue({ posts, totalItems: 1, totalPages: 1 })

    const result = await getCategoryArchive({ slug: 'football' })
    expect(result?.category).toEqual(category)
    expect(result?.posts).toEqual(posts)
    expect(result?.pagination).toEqual({
      currentPage: 1,
      totalPages: 1,
      totalItems: 1,
      perPage: 10,
    })
  })
})
