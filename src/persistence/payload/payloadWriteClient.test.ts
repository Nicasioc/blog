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

import { serverEnv } from '@/lib/env.server'
import { payloadMutate } from './payloadWriteClient'

describe('payloadMutate', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('throws when PAYLOAD_API_KEY is not set', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(vi.mocked(serverEnv) as any).PAYLOAD_API_KEY = undefined

    await expect(payloadMutate('/posts', { method: 'POST', body: { title: 'x' } })).rejects.toThrow(
      'PAYLOAD_API_KEY is required',
    )

    vi.mocked(serverEnv).PAYLOAD_API_KEY = 'test-api-key'
  })

  it('sends an authenticated request with the tenant id merged into the body', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ doc: { id: 1, title: 'x' }, message: 'created' }),
    } as Response)

    const result = await payloadMutate('/posts', {
      method: 'POST',
      body: { title: 'x' },
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toBe('https://cms.example.com/api/posts')
    expect(init).toMatchObject({
      method: 'POST',
      headers: expect.objectContaining({
        Authorization: 'users API-Key test-api-key',
        'Content-Type': 'application/json',
      }),
    })
    expect(JSON.parse(init?.body as string)).toEqual({ title: 'x', tenant: 42 })
    expect(result).toEqual({ id: 1, title: 'x' })
  })

  it('throws PayloadApiError on a non-ok response', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce({ ok: false, status: 403 } as Response)

    await expect(payloadMutate('/posts', { method: 'POST', body: {} })).rejects.toMatchObject({
      name: 'PayloadApiError',
      status: 403,
    })
  })
})
