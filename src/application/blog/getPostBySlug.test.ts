import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getPostBySlug } from './getPostBySlug'

vi.mock('@/persistence/payload/repositories/postRepository', () => ({
  fetchPostBySlug: vi.fn(),
  fetchRelatedPosts: vi.fn(),
  fetchPostsList: vi.fn(),
}))
vi.mock('@/persistence/payload/repositories/commentRepository', () => ({
  fetchCommentsByPostId: vi.fn(),
}))

import {
  fetchPostBySlug,
  fetchRelatedPosts,
  fetchPostsList,
} from '@/persistence/payload/repositories/postRepository'
import { fetchCommentsByPostId } from '@/persistence/payload/repositories/commentRepository'

const makePost = (id: number, categoryIds: number[] = []) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ({ id, slug: `post-${id}`, categories: categoryIds.map((cid) => ({ id: cid })) }) as any

const recentResult = (posts: unknown[]) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ({ posts, totalItems: posts.length, totalPages: 1 }) as any

describe('getPostBySlug', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fetchCommentsByPostId).mockResolvedValue([])
    vi.mocked(fetchPostsList).mockResolvedValue(recentResult([]))
  })

  it('returns null when post is not found', async () => {
    vi.mocked(fetchPostBySlug).mockResolvedValue(null)
    expect(await getPostBySlug('missing')).toBeNull()
  })

  it('calls fetchRelatedPosts with the post category ids and post id', async () => {
    vi.mocked(fetchPostBySlug).mockResolvedValue(makePost(10, [2, 4]))
    vi.mocked(fetchRelatedPosts).mockResolvedValue([makePost(1), makePost(2), makePost(3)])

    await getPostBySlug('test-post')

    expect(fetchRelatedPosts).toHaveBeenCalledWith([2, 4], 10)
  })

  it('does not top up when the category already yields the target', async () => {
    vi.mocked(fetchPostBySlug).mockResolvedValue(makePost(10, [2]))
    vi.mocked(fetchRelatedPosts).mockResolvedValue([makePost(1), makePost(2), makePost(3)])

    const result = await getPostBySlug('test-post')

    expect(result?.relatedPosts.map((p) => p.id)).toEqual([1, 2, 3])
    expect(fetchPostsList).not.toHaveBeenCalled()
  })

  it('tops up with recent posts when the category yields too few', async () => {
    vi.mocked(fetchPostBySlug).mockResolvedValue(makePost(10, [2]))
    vi.mocked(fetchRelatedPosts).mockResolvedValue([makePost(1)])
    vi.mocked(fetchPostsList).mockResolvedValue(
      recentResult([makePost(10), makePost(1), makePost(5), makePost(6)]),
    )

    const result = await getPostBySlug('test-post')

    // category match first, then recent — current post (10) and dupes removed
    expect(result?.relatedPosts.map((p) => p.id)).toEqual([1, 5, 6])
  })

  it('returns fewer than the target without error when the site has too few posts', async () => {
    vi.mocked(fetchPostBySlug).mockResolvedValue(makePost(10, [2]))
    vi.mocked(fetchRelatedPosts).mockResolvedValue([])
    vi.mocked(fetchPostsList).mockResolvedValue(recentResult([makePost(10), makePost(7)]))

    const result = await getPostBySlug('test-post')

    expect(result?.relatedPosts.map((p) => p.id)).toEqual([7])
  })

  it('returns assembled post detail data', async () => {
    const post = makePost(10, [2])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const comments = [{ id: 1 }] as any[]
    vi.mocked(fetchPostBySlug).mockResolvedValue(post)
    vi.mocked(fetchRelatedPosts).mockResolvedValue([makePost(1), makePost(2), makePost(3)])
    vi.mocked(fetchCommentsByPostId).mockResolvedValue(comments)

    const result = await getPostBySlug('test-post')

    expect(result?.post).toEqual(post)
    expect(result?.comments).toEqual(comments)
  })
})
