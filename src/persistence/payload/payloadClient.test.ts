import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/env.server', () => ({
  serverEnv: {
    PAYLOAD_API_URL: 'https://cms.example.com/api',
    PAYLOAD_TENANT_SLUG: 'debate-cuervo',
    PAYLOAD_API_KEY: 'test-api-key',
    REVALIDATE_POSTS: 3600,
    REVALIDATE_PAGES: 86400,
  },
}))

import { payloadFetch } from './payloadClient'

const tenantResponse = (id = 1) => ({
  ok: true,
  json: async () => ({ docs: [{ id }], totalDocs: 1, totalPages: 1 }),
})

const listResponse = (docs: unknown[], totalDocs = docs.length, totalPages = 1) => ({
  ok: true,
  json: async () => ({ docs, totalDocs, totalPages }),
})

describe('payloadFetch', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('resolves the tenant id first, then scopes the request to it', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(tenantResponse(42) as Response)
    fetchMock.mockResolvedValueOnce(listResponse([{ slug: 'foo' }]) as Response)

    const result = await payloadFetch('/posts', { where: { slug: { equals: 'foo' } } })

    expect(fetchMock).toHaveBeenCalledTimes(2)

    const tenantUrl = new URL(fetchMock.mock.calls[0][0] as string)
    expect(tenantUrl.pathname).toBe('/api/tenants')
    expect(tenantUrl.searchParams.get('where[slug][equals]')).toBe('debate-cuervo')

    const tenantCallOptions = fetchMock.mock.calls[0][1] as RequestInit
    expect((tenantCallOptions.headers as Record<string, string>).Authorization).toBe(
      'users API-Key test-api-key',
    )

    const dataCallOptions = fetchMock.mock.calls[1][1] as RequestInit
    expect(dataCallOptions.headers).toBeUndefined()

    const dataUrl = new URL(fetchMock.mock.calls[1][0] as string)
    expect(dataUrl.pathname).toBe('/api/posts')
    expect(dataUrl.searchParams.get('where[slug][equals]')).toBe('foo')
    expect(dataUrl.searchParams.get('where[tenant][equals]')).toBe('42')

    expect(result).toEqual({ data: [{ slug: 'foo' }], totalItems: 1, totalPages: 1 })
  })

  it('skips tenant resolution when scopeToTenant is false', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(listResponse([{ id: 1 }]) as Response)

    await payloadFetch('/tenants', { scopeToTenant: false })

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('builds select[field]=true params', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(tenantResponse() as Response)
    fetchMock.mockResolvedValueOnce(listResponse([]) as Response)

    await payloadFetch('/posts', { select: ['slug'] })

    const dataUrl = new URL(fetchMock.mock.calls[1][0] as string)
    expect(dataUrl.searchParams.get('select[slug]')).toBe('true')
  })

  it('defaults depth to 2 and allows overriding it', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(listResponse([]) as Response)

    await payloadFetch('/tenants', { scopeToTenant: false, depth: 0 })

    const dataUrl = new URL(fetchMock.mock.calls[0][0] as string)
    expect(dataUrl.searchParams.get('depth')).toBe('0')
  })

  it('throws PayloadApiError on a non-ok response', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500 } as Response)

    await expect(payloadFetch('/tenants', { scopeToTenant: false })).rejects.toMatchObject({
      name: 'PayloadApiError',
      status: 500,
      endpoint: '/tenants',
    })
  })

  it('throws when no tenant matches PAYLOAD_TENANT_SLUG', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ docs: [], totalDocs: 0, totalPages: 1 }),
    } as Response)

    await expect(payloadFetch('/posts')).rejects.toThrow(
      'No Payload tenant found for slug "debate-cuervo"',
    )
  })
})
