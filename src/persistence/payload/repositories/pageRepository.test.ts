import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/env.server', () => ({
  serverEnv: { REVALIDATE_PAGES: 86400 },
}))

vi.mock('@/persistence/payload/payloadClient', () => ({ payloadFetch: vi.fn() }))
vi.mock('@/persistence/payload/mappers/pageMapper', () => ({
  mapPayloadPageToPage: vi.fn((dto: { slug: string }) => ({ slug: dto.slug })),
}))

import { payloadFetch } from '@/persistence/payload/payloadClient'
import { fetchPageBySlug, fetchAllPageSlugs } from './pageRepository'

const makeResult = (data: unknown[], totalPages = 1) => ({
  data,
  totalItems: data.length,
  totalPages,
})

describe('fetchPageBySlug', () => {
  beforeEach(() => vi.clearAllMocks())

  it('queries by slug, scoped to published, and maps the first match', async () => {
    vi.mocked(payloadFetch).mockResolvedValue(makeResult([{ id: 1, slug: 'about-us' }]))

    const page = await fetchPageBySlug('about-us')

    expect(payloadFetch).toHaveBeenCalledWith(
      '/pages',
      expect.objectContaining({
        where: { slug: { equals: 'about-us' }, _status: { equals: 'published' } },
      }),
    )
    expect(page).toEqual({ slug: 'about-us' })
  })

  it('returns null when no page matches', async () => {
    vi.mocked(payloadFetch).mockResolvedValue(makeResult([]))
    expect(await fetchPageBySlug('missing')).toBeNull()
  })
})

describe('fetchAllPageSlugs', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns published page slugs only', async () => {
    vi.mocked(payloadFetch).mockResolvedValue(
      makeResult([{ slug: 'about-us' }, { slug: 'contact' }]),
    )

    const slugs = await fetchAllPageSlugs()

    expect(payloadFetch).toHaveBeenCalledWith(
      '/pages',
      expect.objectContaining({ where: { _status: { equals: 'published' } }, select: ['slug'] }),
    )
    expect(slugs).toEqual([{ slug: 'about-us' }, { slug: 'contact' }])
  })
})
