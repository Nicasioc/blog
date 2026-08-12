import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/persistence/payload/payloadClient', () => ({ payloadFetch: vi.fn() }))
vi.mock('@/persistence/payload/mappers/tagMapper', () => ({
  mapPayloadTagToTag: vi.fn((dto: { slug: string }) => ({ slug: dto.slug })),
}))

import { payloadFetch } from '@/persistence/payload/payloadClient'
import { fetchTagBySlug } from './tagRepository'

const makeResult = (data: unknown[]) => ({ data, totalItems: data.length, totalPages: 1 })

describe('fetchTagBySlug', () => {
  beforeEach(() => vi.clearAllMocks())

  it('queries by slug and maps the first match', async () => {
    vi.mocked(payloadFetch).mockResolvedValue(makeResult([{ id: 3, slug: 'champions' }]))

    const tag = await fetchTagBySlug('champions')

    expect(payloadFetch).toHaveBeenCalledWith(
      '/tags',
      expect.objectContaining({ where: { slug: { equals: 'champions' } } }),
    )
    expect(tag).toEqual({ slug: 'champions' })
  })

  it('returns null when no tag matches', async () => {
    vi.mocked(payloadFetch).mockResolvedValue(makeResult([]))
    expect(await fetchTagBySlug('unknown')).toBeNull()
  })
})
