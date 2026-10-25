import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }))
vi.mock('@/lib/env.server', () => ({
  serverEnv: { REVALIDATE_SECRET: 'right-secret', REVALIDATE_POSTS: 300 },
}))

import { NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'
import { POST } from '@/app/api/revalidate/route'

const buildRequest = ({
  query = '',
  headers = {},
  body = JSON.stringify({ slug: 'hello' }),
}: {
  query?: string
  headers?: Record<string, string>
  body?: string
} = {}) =>
  new NextRequest(`http://localhost/api/revalidate${query}`, { method: 'POST', headers, body })

describe('POST /api/revalidate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('accepts the secret in the Authorization header and revalidates tags', async () => {
    const response = await POST(buildRequest({ headers: { authorization: 'Bearer right-secret' } }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ revalidated: true, slug: 'hello' })
    expect(revalidateTag).toHaveBeenCalledWith('post-hello', { expire: 300 })
    expect(revalidateTag).toHaveBeenCalledWith('posts', { expire: 300 })
  })

  it('no longer accepts the secret in the query string', async () => {
    const response = await POST(buildRequest({ query: '?secret=right-secret' }))

    expect(response.status).toBe(401)
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('rejects a wrong secret in the header', async () => {
    const response = await POST(buildRequest({ headers: { authorization: 'Bearer wrong' } }))

    expect(response.status).toBe(401)
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('rejects a request with no secret', async () => {
    const response = await POST(buildRequest())

    expect(response.status).toBe(401)
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('rejects a non-Bearer scheme carrying the right secret', async () => {
    const response = await POST(buildRequest({ headers: { authorization: 'Basic right-secret' } }))

    expect(response.status).toBe(401)
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('accepts a lowercase bearer scheme', async () => {
    const response = await POST(buildRequest({ headers: { authorization: 'bearer right-secret' } }))

    expect(response.status).toBe(200)
  })

  it('rejects a Bearer header with an empty value', async () => {
    const response = await POST(buildRequest({ headers: { authorization: 'Bearer ' } }))

    expect(response.status).toBe(401)
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('ignores a right query secret when the header is wrong', async () => {
    const response = await POST(
      buildRequest({ query: '?secret=right-secret', headers: { authorization: 'Bearer wrong' } }),
    )

    expect(response.status).toBe(401)
  })

  it('revalidates posts with slug "all" when the body is malformed JSON', async () => {
    const response = await POST(
      buildRequest({ headers: { authorization: 'Bearer right-secret' }, body: '{not json' }),
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ revalidated: true, slug: 'all' })
    expect(revalidateTag).toHaveBeenCalledTimes(1)
    expect(revalidateTag).toHaveBeenCalledWith('posts', { expire: 300 })
  })

  it.each(['null', '[]', '{"slug":123}', '{"slug":{}}'])(
    'only revalidates posts when the body is %s',
    async (body) => {
      const response = await POST(
        buildRequest({ headers: { authorization: 'Bearer right-secret' }, body }),
      )

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ revalidated: true, slug: 'all' })
      expect(revalidateTag).toHaveBeenCalledTimes(1)
      expect(revalidateTag).toHaveBeenCalledWith('posts', { expire: 300 })
    },
  )
})
