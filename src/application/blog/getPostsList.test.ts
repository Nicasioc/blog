import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getPostsList } from './getPostsList'

vi.mock('@/persistence/payload/repositories/postRepository', () => ({
  fetchPostsList: vi.fn(),
}))

import { fetchPostsList } from '@/persistence/payload/repositories/postRepository'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makePost = (id: number) => ({ id, slug: `post-${id}` }) as any

describe('getPostsList', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uses default page=1 and perPage=10 when no params given', async () => {
    vi.mocked(fetchPostsList).mockResolvedValue({ posts: [], totalItems: 0, totalPages: 0 })
    await getPostsList()
    expect(fetchPostsList).toHaveBeenCalledWith({
      page: 1,
      perPage: 10,
      categoryId: undefined,
      tagId: undefined,
    })
  })

  it('forwards custom params to the repo', async () => {
    vi.mocked(fetchPostsList).mockResolvedValue({ posts: [], totalItems: 0, totalPages: 0 })
    await getPostsList({ page: 3, perPage: 5, categoryId: 7, tagId: 2 })
    expect(fetchPostsList).toHaveBeenCalledWith({ page: 3, perPage: 5, categoryId: 7, tagId: 2 })
  })

  it('returns posts from repo', async () => {
    const posts = [makePost(1), makePost(2)]
    vi.mocked(fetchPostsList).mockResolvedValue({ posts, totalItems: 2, totalPages: 1 })
    const result = await getPostsList()
    expect(result.posts).toEqual(posts)
  })

  it('assembles pagination correctly', async () => {
    vi.mocked(fetchPostsList).mockResolvedValue({ posts: [], totalItems: 50, totalPages: 5 })
    const result = await getPostsList({ page: 2, perPage: 10 })
    expect(result.pagination).toEqual({
      currentPage: 2,
      totalPages: 5,
      totalItems: 50,
      perPage: 10,
    })
  })
})
