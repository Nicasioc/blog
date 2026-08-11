import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/persistence/payload/payloadClient', () => ({ payloadFetch: vi.fn() }))
vi.mock('@/persistence/payload/payloadWriteClient', () => ({ payloadMutate: vi.fn() }))
vi.mock('@/persistence/payload/mappers/commentMapper', () => ({
  mapPayloadCommentToComment: vi.fn((dto: { id: number }) => ({ id: dto.id, children: [] })),
  buildCommentTree: vi.fn((flat: unknown[]) => flat),
}))

import { payloadFetch } from '@/persistence/payload/payloadClient'
import { payloadMutate } from '@/persistence/payload/payloadWriteClient'
import { fetchCommentsByPostId, createComment } from './commentRepository'

describe('fetchCommentsByPostId', () => {
  beforeEach(() => vi.clearAllMocks())

  it('scopes the query to the post and to approved status', async () => {
    vi.mocked(payloadFetch).mockResolvedValue({
      data: [{ id: 1 }],
      totalItems: 1,
      totalPages: 1,
    })

    const comments = await fetchCommentsByPostId(100)

    expect(payloadFetch).toHaveBeenCalledWith(
      '/comments',
      expect.objectContaining({
        where: { post: { equals: 100 }, status: { equals: 'approved' } },
      }),
    )
    expect(comments).toEqual([{ id: 1, children: [] }])
  })
})

describe('createComment', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sends the submission fields to payloadMutate and maps the result', async () => {
    vi.mocked(payloadMutate).mockResolvedValue({ id: 5 })

    const comment = await createComment({
      postId: 100,
      authorName: 'Jane',
      authorEmail: 'jane@example.com',
      content: 'Nice post!',
    })

    expect(payloadMutate).toHaveBeenCalledWith('/comments', {
      method: 'POST',
      body: {
        post: 100,
        parent: undefined,
        authorName: 'Jane',
        authorEmail: 'jane@example.com',
        authorUrl: '',
        content: 'Nice post!',
      },
    })
    expect(comment).toEqual({ id: 5, children: [] })
  })
})
