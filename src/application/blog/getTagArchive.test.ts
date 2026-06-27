import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getTagArchive } from './getTagArchive'

vi.mock('@/persistence/wordpress/repositories/tagRepository', () => ({
  fetchTagBySlug: vi.fn(),
}))
vi.mock('@/persistence/wordpress/repositories/postRepository', () => ({
  fetchPostsList: vi.fn(),
}))

import { fetchTagBySlug } from '@/persistence/wordpress/repositories/tagRepository'
import { fetchPostsList } from '@/persistence/wordpress/repositories/postRepository'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeTag = (id: number) => ({ id, slug: `tag-${id}`, name: `Tag ${id}` }) as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makePost = (id: number) => ({ id, slug: `post-${id}` }) as any

describe('getTagArchive', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null when tag is not found', async () => {
    vi.mocked(fetchTagBySlug).mockResolvedValue(null)
    const result = await getTagArchive({ slug: 'unknown' })
    expect(result).toBeNull()
  })

  it('passes tag.id as tagId to fetchPostsList', async () => {
    vi.mocked(fetchTagBySlug).mockResolvedValue(makeTag(9))
    vi.mocked(fetchPostsList).mockResolvedValue({ posts: [], totalItems: 0, totalPages: 0 })
    await getTagArchive({ slug: 'champions', page: 2, perPage: 5 })
    expect(fetchPostsList).toHaveBeenCalledWith({ tagId: 9, page: 2, perPage: 5 })
  })

  it('returns assembled tag archive data', async () => {
    const tag = makeTag(9)
    const posts = [makePost(1)]
    vi.mocked(fetchTagBySlug).mockResolvedValue(tag)
    vi.mocked(fetchPostsList).mockResolvedValue({ posts, totalItems: 1, totalPages: 1 })

    const result = await getTagArchive({ slug: 'champions' })
    expect(result?.tag).toEqual(tag)
    expect(result?.posts).toEqual(posts)
    expect(result?.pagination).toEqual({
      currentPage: 1,
      totalPages: 1,
      totalItems: 1,
      perPage: 10,
    })
  })
})
