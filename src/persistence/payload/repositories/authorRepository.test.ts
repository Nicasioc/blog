import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/persistence/payload/payloadClient', () => ({ payloadFetch: vi.fn() }))
vi.mock('@/persistence/payload/mappers/authorMapper', () => ({
  mapPayloadAuthorToAuthor: vi.fn((dto: { slug: string }) => ({ slug: dto.slug })),
}))

import { payloadFetch } from '@/persistence/payload/payloadClient'
import { fetchAuthorById, fetchAuthorBySlug } from './authorRepository'

const makeResult = (data: unknown[]) => ({ data, totalItems: data.length, totalPages: 1 })

describe('fetchAuthorById', () => {
  beforeEach(() => vi.clearAllMocks())

  it('queries by id and maps the first match', async () => {
    vi.mocked(payloadFetch).mockResolvedValue(makeResult([{ id: 1, slug: 'john' }]))

    const author = await fetchAuthorById(1)

    expect(payloadFetch).toHaveBeenCalledWith(
      '/authors',
      expect.objectContaining({ where: { id: { equals: 1 } } }),
    )
    expect(author).toEqual({ slug: 'john' })
  })

  it('returns null when no author matches', async () => {
    vi.mocked(payloadFetch).mockResolvedValue(makeResult([]))
    expect(await fetchAuthorById(999)).toBeNull()
  })
})

describe('fetchAuthorBySlug', () => {
  beforeEach(() => vi.clearAllMocks())

  it('queries by slug and maps the first match', async () => {
    vi.mocked(payloadFetch).mockResolvedValue(makeResult([{ id: 1, slug: 'john' }]))

    const author = await fetchAuthorBySlug('john')

    expect(payloadFetch).toHaveBeenCalledWith(
      '/authors',
      expect.objectContaining({ where: { slug: { equals: 'john' } } }),
    )
    expect(author).toEqual({ slug: 'john' })
  })

  it('returns null when no author matches', async () => {
    vi.mocked(payloadFetch).mockResolvedValue(makeResult([]))
    expect(await fetchAuthorBySlug('unknown')).toBeNull()
  })
})
