import { describe, it, expect } from 'vitest'
import {
  ANONYMOUS_AUTHOR,
  mapPayloadCommentToComment,
  buildCommentTree,
} from '@/persistence/payload/mappers/commentMapper'
import type { PayloadCommentDto } from '@/persistence/payload/types/payloadComment.dto'
import type { Comment } from '@/domain/comment/comment.model'

const baseDto: PayloadCommentDto = {
  id: 1,
  post: 100,
  authorName: 'Jane',
  content: 'Great post!',
  status: 'approved',
  createdAt: '2024-01-01T10:00:00.000Z',
}

describe('mapPayloadCommentToComment', () => {
  it('maps basic fields', () => {
    const comment = mapPayloadCommentToComment(baseDto)!
    expect(comment).toMatchObject({
      id: 1,
      postId: 100,
      authorName: 'Jane',
      content: 'Great post!',
    })
  })

  it('maps a missing parent to null', () => {
    const comment = mapPayloadCommentToComment(baseDto)!
    expect(comment.parentId).toBeNull()
  })

  it('maps a present parent id', () => {
    const comment = mapPayloadCommentToComment({ ...baseDto, parent: 5 })!
    expect(comment.parentId).toBe(5)
  })

  it('maps a falsy authorUrl to null', () => {
    const comment = mapPayloadCommentToComment({ ...baseDto, authorUrl: '' })!
    expect(comment.authorUrl).toBeNull()
  })

  it('parses createdAt as a Date', () => {
    const comment = mapPayloadCommentToComment(baseDto)!
    expect(comment.publishedAt.toISOString()).toBe('2024-01-01T10:00:00.000Z')
  })

  it('always starts with empty children', () => {
    const comment = mapPayloadCommentToComment(baseDto)!
    expect(comment.children).toEqual([])
  })
})

describe('mapPayloadCommentToComment — malformed payloads', () => {
  const map = (patch: Record<string, unknown>) =>
    mapPayloadCommentToComment({ ...baseDto, ...patch } as never)

  it.each([null, undefined, ''])('falls back to the anonymous author for authorName %j', (name) => {
    expect(map({ authorName: name })?.authorName).toBe(ANONYMOUS_AUTHOR)
  })

  it.each([123, [], {}, '   '])('falls back to the anonymous author for authorName %j', (name) => {
    expect(map({ authorName: name })?.authorName).toBe(ANONYMOUS_AUTHOR)
  })

  it('trims the author name', () => {
    expect(map({ authorName: '  Jane ' })?.authorName).toBe('Jane')
  })

  it.each([null, undefined, '', '   ', 42, [], {}])(
    'drops a comment with content %j',
    (content) => {
      expect(map({ content })).toBeNull()
    },
  )

  it.each([undefined, null, 'not-a-date', '', 12345, {}])(
    'drops a comment with createdAt %j',
    (createdAt) => {
      expect(map({ createdAt })).toBeNull()
    },
  )

  it.each([undefined, null, 'abc', 0, -1, 1.5, {}])('drops a comment with id %j', (id) => {
    expect(map({ id })).toBeNull()
  })

  it.each([undefined, null, '100', 0, {}, { id: 'x' }])('drops a comment with post %j', (post) => {
    expect(map({ post })).toBeNull()
  })

  it('returns null for a null or undefined dto', () => {
    expect(mapPayloadCommentToComment(null as never)).toBeNull()
    expect(mapPayloadCommentToComment(undefined as never)).toBeNull()
  })

  it.each(['abc', 1.5, 0, -2, {}, '5', { id: 'x' }])(
    'maps an invalid parent %j to null',
    (parent) => {
      expect(map({ parent })?.parentId).toBeNull()
    },
  )

  it('accepts populated relationship objects for post and parent', () => {
    const comment = map({ post: { id: 100, title: 'x' }, parent: { id: 5 } })
    expect(comment).toMatchObject({ postId: 100, parentId: 5 })
  })

  it('returns a trimmed author URL', () => {
    expect(map({ authorUrl: ' https://example.com ' })?.authorUrl).toBe('https://example.com')
  })

  it('keeps only http(s) author URLs', () => {
    expect(map({ authorUrl: 'https://example.com' })?.authorUrl).toBe('https://example.com')
    expect(map({ authorUrl: 'http://example.com' })?.authorUrl).toBe('http://example.com')
    expect(map({ authorUrl: 'javascript:alert(1)' })?.authorUrl).toBeNull()
    expect(map({ authorUrl: 'ftp://example.com' })?.authorUrl).toBeNull()
    expect(map({ authorUrl: 'not a url' })?.authorUrl).toBeNull()
    expect(map({ authorUrl: 42 })?.authorUrl).toBeNull()
  })
})

const makeComment = (overrides: Partial<Comment>): Comment => ({
  id: 1,
  postId: 100,
  parentId: null,
  authorName: 'Author',
  authorUrl: null,
  publishedAt: new Date('2024-01-01'),
  content: 'text',
  children: [],
  ...overrides,
})

describe('buildCommentTree', () => {
  it('returns root comments with no parent as top-level', () => {
    const tree = buildCommentTree([makeComment({ id: 1, parentId: null })])
    expect(tree).toHaveLength(1)
    expect(tree[0].id).toBe(1)
  })

  it('nests a comment under its parent', () => {
    const tree = buildCommentTree([
      makeComment({ id: 1, parentId: null }),
      makeComment({ id: 2, parentId: 1 }),
    ])
    expect(tree).toHaveLength(1)
    expect(tree[0].children).toHaveLength(1)
    expect(tree[0].children[0].id).toBe(2)
  })

  it('treats a comment with a missing parent as a root (orphan-safe)', () => {
    const tree = buildCommentTree([makeComment({ id: 2, parentId: 999 })])
    expect(tree).toHaveLength(1)
    expect(tree[0].id).toBe(2)
  })
})
