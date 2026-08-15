import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getPostBySlug } from './getPostBySlug'

vi.mock('@/persistence/payload/repositories/postRepository', () => ({
  fetchPostBySlug: vi.fn(),
  fetchRelatedPosts: vi.fn(),
}))
vi.mock('@/persistence/payload/repositories/commentRepository', () => ({
  fetchCommentsByPostId: vi.fn(),
}))

import {
  fetchPostBySlug,
  fetchRelatedPosts,
} from '@/persistence/payload/repositories/postRepository'
import { fetchCommentsByPostId } from '@/persistence/payload/repositories/commentRepository'

const makePost = (id: number, categoryIds: number[] = []) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ({ id, slug: `post-${id}`, categories: categoryIds.map((cid) => ({ id: cid })) }) as any

describe('getPostBySlug', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null when post is not found', async () => {
    vi.mocked(fetchPostBySlug).mockResolvedValue(null)
    const result = await getPostBySlug('missing')
    expect(result).toBeNull()
  })

  it('calls fetchRelatedPosts with the posts category ids and post id', async () => {
    const post = makePost(10, [2, 4])
    vi.mocked(fetchPostBySlug).mockResolvedValue(post)
    vi.mocked(fetchRelatedPosts).mockResolvedValue([])
    vi.mocked(fetchCommentsByPostId).mockResolvedValue([])

    await getPostBySlug('test-post')
    expect(fetchRelatedPosts).toHaveBeenCalledWith([2, 4], 10)
  })

  it('returns assembled post detail data', async () => {
    const post = makePost(10, [2])
    const relatedPosts = [makePost(20)]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const comments = [{ id: 1 }] as any[]
    vi.mocked(fetchPostBySlug).mockResolvedValue(post)
    vi.mocked(fetchRelatedPosts).mockResolvedValue(relatedPosts)
    vi.mocked(fetchCommentsByPostId).mockResolvedValue(comments)

    const result = await getPostBySlug('test-post')
    expect(result?.post).toEqual(post)
    expect(result?.relatedPosts).toEqual(relatedPosts)
    expect(result?.comments).toEqual(comments)
  })
})
