import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }))
vi.mock('@/lib/env.server', () => ({ serverEnv: { WORDPRESS_API_URL: 'https://wp.example.com' } }))
vi.mock('@/utils/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

import { submitComment } from './submitComment'

const validData = {
  postId: 1,
  parentId: null,
  authorName: 'Alice',
  authorEmail: 'alice@example.com',
  authorUrl: '',
  content: 'Great post!',
}

const mockFetchOk = () =>
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }))

const mockFetchFail = (status: number, message: string) =>
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: false, status, json: async () => ({ message }) }),
  )

describe('submitComment — validation', () => {
  beforeEach(() => vi.unstubAllGlobals())

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
    mockFetchOk()
    const result = await submitComment({ ...validData, authorUrl: 'http://example.com' })
    expect(result).toMatchObject({ success: true })
  })

  it('accepts a valid https URL', async () => {
    mockFetchOk()
    const result = await submitComment({ ...validData, authorUrl: 'https://example.com' })
    expect(result).toMatchObject({ success: true })
  })

  it('accepts an absent URL (empty string)', async () => {
    mockFetchOk()
    const result = await submitComment({ ...validData, authorUrl: '' })
    expect(result).toMatchObject({ success: true })
  })
})

describe('submitComment — fetch outcomes', () => {
  beforeEach(() => vi.unstubAllGlobals())

  it('returns success: true when API responds 2xx', async () => {
    mockFetchOk()
    const result = await submitComment(validData)
    expect(result).toEqual({ success: true })
  })

  it('returns success: false with error message when API responds non-2xx', async () => {
    mockFetchFail(422, 'Duplicate comment')
    const result = await submitComment(validData)
    expect(result).toMatchObject({ success: false, error: 'Duplicate comment' })
  })
})
