import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/persistence/payload/repositories/commentRepository', () => ({
  createComment: vi.fn(),
}))

import { submitComment } from './submitComment'
import { createComment } from '@/persistence/payload/repositories/commentRepository'
import { PayloadApiError } from '@/persistence/payload/payloadError'

const validData = {
  postId: 1,
  parentId: undefined,
  authorName: 'Alice',
  authorEmail: 'alice@example.com',
  authorUrl: '',
  content: 'Great post!',
}

describe('submitComment — validation', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects blank name', async () => {
    const result = await submitComment({ ...validData, authorName: '   ' })
    expect(result).toMatchObject({ success: false })
  })

  it('rejects name exceeding 100 characters', async () => {
    const result = await submitComment({ ...validData, authorName: 'a'.repeat(101) })
    expect(result).toMatchObject({ success: false })
  })

  it('rejects blank email', async () => {
    const result = await submitComment({ ...validData, authorEmail: '' })
    expect(result).toMatchObject({ success: false })
  })

  it('rejects blank content', async () => {
    const result = await submitComment({ ...validData, content: '   ' })
    expect(result).toMatchObject({ success: false })
  })

  it('rejects content exceeding 5000 characters', async () => {
    const result = await submitComment({ ...validData, content: 'a'.repeat(5001) })
    expect(result).toMatchObject({ success: false })
  })

  it('rejects a malformed URL', async () => {
    const result = await submitComment({ ...validData, authorUrl: 'not-a-url' })
    expect(result).toMatchObject({ success: false })
  })

  it('rejects a non-http(s) URL protocol', async () => {
    const result = await submitComment({ ...validData, authorUrl: 'ftp://example.com' })
    expect(result).toMatchObject({ success: false })
  })

  it('accepts a valid http URL', async () => {
    vi.mocked(createComment).mockResolvedValue({} as never)
    const result = await submitComment({ ...validData, authorUrl: 'http://example.com' })
    expect(result).toMatchObject({ success: true })
  })

  it('accepts a valid https URL', async () => {
    vi.mocked(createComment).mockResolvedValue({} as never)
    const result = await submitComment({ ...validData, authorUrl: 'https://example.com' })
    expect(result).toMatchObject({ success: true })
  })

  it('accepts an absent URL (empty string)', async () => {
    vi.mocked(createComment).mockResolvedValue({} as never)
    const result = await submitComment({ ...validData, authorUrl: '' })
    expect(result).toMatchObject({ success: true })
  })
})

describe('submitComment — createComment outcomes', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns success: true when createComment resolves', async () => {
    vi.mocked(createComment).mockResolvedValue({} as never)
    const result = await submitComment(validData)
    expect(result).toEqual({ success: true })
  })

  it('surfaces the message when createComment rejects with a PayloadApiError', async () => {
    vi.mocked(createComment).mockRejectedValue(
      new PayloadApiError(422, '/comments', 'Duplicate comment'),
    )
    const result = await submitComment(validData)
    expect(result).toMatchObject({ success: false, error: 'Duplicate comment' })
  })

  it('returns a generic message when createComment rejects with a non-API error', async () => {
    vi.mocked(createComment).mockRejectedValue(new Error('No Payload tenant found for slug "x"'))
    const result = await submitComment(validData)
    expect(result).toMatchObject({
      success: false,
      error: 'Something went wrong submitting your comment. Please try again.',
    })
  })
})
