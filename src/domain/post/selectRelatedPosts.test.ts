import { describe, it, expect } from 'vitest'
import { selectRelatedPosts } from '@/domain/post/selectRelatedPosts'
import type { Post } from '@/domain/post/post.model'

const post = (id: number): Post => ({ id, slug: `post-${id}` }) as Post

describe('selectRelatedPosts', () => {
  it('keeps category matches when there are already enough', () => {
    const result = selectRelatedPosts([post(1), post(2), post(3), post(4)], [post(9)], 10, 3)
    expect(result.map((p) => p.id)).toEqual([1, 2, 3])
  })

  it('tops up with recent posts when category matches are thin', () => {
    const result = selectRelatedPosts([post(1)], [post(5), post(6), post(7)], 10, 3)
    expect(result.map((p) => p.id)).toEqual([1, 5, 6])
  })

  it('never includes the current post', () => {
    const result = selectRelatedPosts([post(1)], [post(10), post(2), post(3)], 10, 3)
    expect(result.map((p) => p.id)).toEqual([1, 2, 3])
  })

  it('de-duplicates a post that is both a category match and a recent post', () => {
    const result = selectRelatedPosts([post(1), post(2)], [post(2), post(3), post(4)], 99, 3)
    expect(result.map((p) => p.id)).toEqual([1, 2, 3])
  })

  it('returns fewer than target when the site has too few posts', () => {
    const result = selectRelatedPosts([], [post(2)], 1, 3)
    expect(result.map((p) => p.id)).toEqual([2])
  })

  it('returns an empty list when the current post is the only one', () => {
    expect(selectRelatedPosts([], [post(1)], 1, 3)).toEqual([])
  })

  it('preserves the given order (category first, then recency)', () => {
    const result = selectRelatedPosts([post(8), post(3)], [post(1), post(2)], 0, 3)
    expect(result.map((p) => p.id)).toEqual([8, 3, 1])
  })
})
