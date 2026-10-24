import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/env.server', () => ({
  serverEnv: {
    PAYLOAD_API_URL: 'https://cms.example.com/api',
    PAYLOAD_API_KEY: 'test-api-key',
  },
}))

vi.mock('@/persistence/payload/payloadClient', () => ({
  resolveTenantId: vi.fn(async () => 42),
}))

import { payloadPublicCreate } from './payloadPublicWriteClient'

describe('payloadPublicCreate', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('posts the body with the tenant id merged in and no Authorization header', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce({ ok: true } as Response)

    await payloadPublicCreate('/comments', { content: 'x' })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toBe('https://cms.example.com/api/comments')
    expect(init?.method).toBe('POST')
    expect(init?.headers).toEqual({ 'Content-Type': 'application/json' })
    expect(JSON.stringify(init?.headers)).not.toContain('test-api-key')
    expect(JSON.parse(init?.body as string)).toEqual({ content: 'x', tenant: 42 })
  })

  it('does not depend on the response body', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error('empty body')
      },
    } as unknown as Response)

    await expect(payloadPublicCreate('/comments', {})).resolves.toBeUndefined()
  })

  it('throws PayloadApiError on a non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 403 } as Response)

    await expect(payloadPublicCreate('/comments', {})).rejects.toMatchObject({
      name: 'PayloadApiError',
      status: 403,
    })
  })
})
