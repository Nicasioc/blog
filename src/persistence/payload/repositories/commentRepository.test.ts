import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/persistence/payload/payloadClient', () => ({ payloadFetch: vi.fn() }))
vi.mock('@/utils/logger', () => ({ logger: { warn: vi.fn() } }))
vi.mock('@/persistence/payload/payloadPublicWriteClient', () => ({
  payloadPublicCreate: vi.fn(),
}))
vi.mock('@/persistence/payload/mappers/commentMapper', () => ({
  mapPayloadCommentToComment: vi.fn((dto: { id: number }) => ({ id: dto.id, children: [] })),
  buildCommentTree: vi.fn((flat: unknown[]) => flat),
}))

import { payloadFetch } from '@/persistence/payload/payloadClient'
import { payloadPublicCreate } from '@/persistence/payload/payloadPublicWriteClient'
import { PayloadApiError } from '@/persistence/payload/payloadError'
import { logger } from '@/utils/logger'
import { mapPayloadCommentToComment } from '@/persistence/payload/mappers/commentMapper'
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

describe('fetchCommentsByPostId — malformed comments', () => {
  beforeEach(() => vi.clearAllMocks())

  it('skips comments the mapper rejects and keeps the rest', async () => {
    vi.mocked(payloadFetch).mockResolvedValue({
      data: [{ id: 1 }, { id: 2 }, { id: 3 }],
      totalItems: 3,
      totalPages: 1,
    })
    vi.mocked(mapPayloadCommentToComment).mockImplementation(((dto: { id: number }) =>
      dto.id === 2 ? null : { id: dto.id, children: [] }) as never)

    const comments = await fetchCommentsByPostId(100)

    expect(comments).toEqual([
      { id: 1, children: [] },
      { id: 3, children: [] },
    ])
    expect(logger.warn).toHaveBeenCalledWith('malformed comments skipped', {
      postId: 100,
      skipped: 1,
    })
  })

  it('does not log when every comment is valid', async () => {
    vi.mocked(payloadFetch).mockResolvedValue({
      data: [{ id: 1 }],
      totalItems: 1,
      totalPages: 1,
    })
    vi.mocked(mapPayloadCommentToComment).mockImplementation(((dto: { id: number }) => ({
      id: dto.id,
      children: [],
    })) as never)

    await fetchCommentsByPostId(100)

    expect(logger.warn).not.toHaveBeenCalled()
  })
})

describe('createComment', () => {
  beforeEach(() => vi.clearAllMocks())

  const submission = {
    postId: 100,
    authorName: 'Jane',
    authorEmail: 'jane@example.com',
    content: 'Nice post!',
  }

  it('sends the submission fields to payloadPublicCreate and returns nothing', async () => {
    vi.mocked(payloadPublicCreate).mockResolvedValue(undefined)

    await expect(createComment(submission)).resolves.toBeUndefined()

    expect(payloadPublicCreate).toHaveBeenCalledWith('/comments', {
      post: 100,
      parent: undefined,
      authorName: 'Jane',
      authorEmail: 'jane@example.com',
      authorUrl: '',
      content: 'Nice post!',
    })
  })

  it('propagates PayloadApiError from a non-OK response', async () => {
    const error = new PayloadApiError(403, '/comments', 'Payload API error: 403')
    vi.mocked(payloadPublicCreate).mockRejectedValue(error)

    await expect(createComment(submission)).rejects.toBe(error)
  })
})
