import { describe, it, expect } from 'vitest'
import {
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
    const comment = mapPayloadCommentToComment(baseDto)
    expect(comment).toMatchObject({
      id: 1,
      postId: 100,
      authorName: 'Jane',
      content: 'Great post!',
    })
  })

  it('maps a missing parent to null', () => {
    const comment = mapPayloadCommentToComment(baseDto)
    expect(comment.parentId).toBeNull()
  })

  it('maps a present parent id', () => {
    const comment = mapPayloadCommentToComment({ ...baseDto, parent: 5 })
    expect(comment.parentId).toBe(5)
  })

  it('maps a falsy authorUrl to null', () => {
    const comment = mapPayloadCommentToComment({ ...baseDto, authorUrl: '' })
    expect(comment.authorUrl).toBeNull()
  })

  it('parses createdAt as a Date', () => {
    const comment = mapPayloadCommentToComment(baseDto)
    expect(comment.publishedAt.toISOString()).toBe('2024-01-01T10:00:00.000Z')
  })

  it('always starts with empty children', () => {
    const comment = mapPayloadCommentToComment(baseDto)
    expect(comment.children).toEqual([])
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
