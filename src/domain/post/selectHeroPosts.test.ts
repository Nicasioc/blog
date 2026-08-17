import { describe, expect, it } from 'vitest'
import { selectHeroPosts } from './selectHeroPosts'
import type { Post } from '@/domain/post/post.model'

const post = (id: number) => ({ id, slug: `post-${id}` }) as Post

describe('selectHeroPosts', () => {
  it('returns an empty array when both inputs are empty', () => {
    expect(selectHeroPosts([], [])).toEqual([])
  })

  it('returns what is available when fewer than count exist, with no padding', () => {
    const result = selectHeroPosts([post(1)], [post(2)])
    expect(result).toEqual([post(1), post(2)])
  })

  it('truncates when more featured posts than count are given', () => {
    const result = selectHeroPosts([post(1), post(2), post(3), post(4)], [])
    expect(result).toEqual([post(1), post(2), post(3)])
  })

  it('backfills remaining slots from recent, after featured', () => {
    const result = selectHeroPosts([post(1)], [post(2), post(3), post(4)])
    expect(result).toEqual([post(1), post(2), post(3)])
  })

  it('deduplicates a post present in both lists, keeping its featured position', () => {
    const result = selectHeroPosts([post(2)], [post(1), post(2), post(3)])
    expect(result).toEqual([post(2), post(1), post(3)])
  })

  it('deduplicates duplicate ids within featured itself', () => {
    const result = selectHeroPosts([post(1), post(1), post(2)], [])
    expect(result).toEqual([post(1), post(2)])
  })

  it('returns an empty array when count is zero or negative', () => {
    expect(selectHeroPosts([post(1)], [post(2)], 0)).toEqual([])
    expect(selectHeroPosts([post(1)], [post(2)], -1)).toEqual([])
  })

  it('treats null, undefined, and non-array inputs as empty', () => {
    expect(selectHeroPosts(null as unknown as Post[], undefined as unknown as Post[])).toEqual([])
    expect(selectHeroPosts('nope' as unknown as Post[], [post(1)])).toEqual([post(1)])
  })
})
