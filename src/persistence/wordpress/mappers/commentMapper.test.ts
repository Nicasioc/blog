import { describe, it, expect } from 'vitest'
import {
  mapWpCommentToComment,
  buildCommentTree,
} from '@/persistence/wordpress/mappers/commentMapper'
import type { WpCommentDto } from '@/persistence/wordpress/types/wpComment.dto'

const baseDto: WpCommentDto = {
  id: 1,
  post: 10,
  parent: 0,
  author_name: 'Alice',
  author_url: '',
  date_gmt: '2024-01-01T10:00:00',
  content: { rendered: '<p>Hello</p>' },
  status: 'approved',
}

describe('mapWpCommentToComment', () => {
  it('maps top-level comment (parent=0 → null)', () => {
    const c = mapWpCommentToComment(baseDto)
    expect(c.parentId).toBeNull()
  })

  it('maps reply (parent=5 → 5)', () => {
    const c = mapWpCommentToComment({ ...baseDto, parent: 5 })
    expect(c.parentId).toBe(5)
  })

  it('normalises empty author_url to null', () => {
    const c = mapWpCommentToComment(baseDto)
    expect(c.authorUrl).toBeNull()
  })

  it('parses date_gmt as UTC', () => {
    const c = mapWpCommentToComment(baseDto)
    expect(c.publishedAt.toISOString()).toBe('2024-01-01T10:00:00.000Z')
  })
})

describe('buildCommentTree', () => {
  it('nests replies under their parent', () => {
    const flat = [
      {
        id: 1,
        postId: 10,
        parentId: null,
        authorName: 'A',
        authorUrl: null,
        publishedAt: new Date(),
        content: '',
        children: [],
      },
      {
        id: 2,
        postId: 10,
        parentId: 1,
        authorName: 'B',
        authorUrl: null,
        publishedAt: new Date(),
        content: '',
        children: [],
      },
    ]
    const tree = buildCommentTree(flat)
    expect(tree).toHaveLength(1)
    expect(tree[0].children).toHaveLength(1)
    expect(tree[0].children[0].id).toBe(2)
  })

  it('treats orphaned replies as top-level', () => {
    const flat = [
      {
        id: 3,
        postId: 10,
        parentId: 99,
        authorName: 'C',
        authorUrl: null,
        publishedAt: new Date(),
        content: '',
        children: [],
      },
    ]
    const tree = buildCommentTree(flat)
    expect(tree).toHaveLength(1)
  })
})
