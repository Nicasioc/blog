import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/persistence/payload/repositories/commentRepository', () => ({
  createComment: vi.fn(),
}))

import { submitComment } from './submitComment'
import { createComment } from '@/persistence/payload/repositories/commentRepository'
import { PayloadApiError } from '@/persistence/payload/payloadError'

const GENERIC = 'Ocurrió un error al enviar tu comentario. Por favor, intenta de nuevo.'

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
    vi.mocked(createComment).mockResolvedValue(undefined)
    const result = await submitComment({ ...validData, authorUrl: 'http://example.com' })
    expect(result).toMatchObject({ success: true })
  })

  it('accepts a valid https URL', async () => {
    vi.mocked(createComment).mockResolvedValue(undefined)
    const result = await submitComment({ ...validData, authorUrl: 'https://example.com' })
    expect(result).toMatchObject({ success: true })
  })

  it('accepts an absent URL (empty string)', async () => {
    vi.mocked(createComment).mockResolvedValue(undefined)
    const result = await submitComment({ ...validData, authorUrl: '' })
    expect(result).toMatchObject({ success: true })
  })
})

describe('submitComment — untrusted input', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each([null, undefined, 42])(
    'returns a validation error for payload %s without throwing',
    async (payload) => {
      const result = await submitComment(payload as never)
      expect(result).toMatchObject({ success: false })
      expect(createComment).not.toHaveBeenCalled()
    },
  )

  it('rejects wrongly typed fields without calling the CMS', async () => {
    expect(await submitComment({ ...validData, authorName: 123 } as never)).toMatchObject({
      success: false,
    })
    expect(await submitComment({ ...validData, content: [] } as never)).toMatchObject({
      success: false,
    })
    expect(await submitComment({ ...validData, postId: 'abc' } as never)).toMatchObject({
      success: false,
    })
    expect(createComment).not.toHaveBeenCalled()
  })

  it('sends the trimmed, parsed data to createComment', async () => {
    vi.mocked(createComment).mockResolvedValue(undefined)
    await submitComment({ ...validData, authorName: '  Alice  ', unexpected: 'x' } as never)
    expect(createComment).toHaveBeenCalledWith(
      expect.not.objectContaining({ unexpected: expect.anything() }),
    )
    expect(createComment).toHaveBeenCalledWith(expect.objectContaining({ authorName: 'Alice' }))
  })
})

describe('submitComment — createComment outcomes', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns success: true when createComment resolves', async () => {
    vi.mocked(createComment).mockResolvedValue(undefined)
    const result = await submitComment(validData)
    expect(result).toEqual({ success: true })
  })

  it('returns the generic message, not the CMS message, on a PayloadApiError', async () => {
    vi.mocked(createComment).mockRejectedValue(
      new PayloadApiError(400, '/comments', 'Payload API error: 400'),
    )
    const result = await submitComment(validData)
    expect(result).toEqual({ success: false, error: GENERIC })
  })

  it('returns the generic message on a non-API error', async () => {
    vi.mocked(createComment).mockRejectedValue(new Error('No Payload tenant found for slug "x"'))
    const result = await submitComment(validData)
    expect(result).toEqual({ success: false, error: GENERIC })
  })
})
