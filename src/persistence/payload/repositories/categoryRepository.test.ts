import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/persistence/payload/payloadClient', () => ({ payloadFetch: vi.fn() }))
vi.mock('@/persistence/payload/mappers/categoryMapper', () => ({
  mapPayloadCategoryToCategory: vi.fn((dto: { slug: string }) => ({ slug: dto.slug })),
}))

import { payloadFetch } from '@/persistence/payload/payloadClient'
import { fetchCategoryBySlug, fetchAllCategories } from './categoryRepository'

const makeResult = (data: unknown[]) => ({ data, totalItems: data.length, totalPages: 1 })

describe('fetchCategoryBySlug', () => {
  beforeEach(() => vi.clearAllMocks())

  it('queries by slug and maps the first match', async () => {
    vi.mocked(payloadFetch).mockResolvedValue(makeResult([{ id: 2, slug: 'football' }]))

    const category = await fetchCategoryBySlug('football')

    expect(payloadFetch).toHaveBeenCalledWith(
      '/categories',
      expect.objectContaining({ where: { slug: { equals: 'football' } } }),
    )
    expect(category).toEqual({ slug: 'football' })
  })

  it('returns null when no category matches', async () => {
    vi.mocked(payloadFetch).mockResolvedValue(makeResult([]))
    expect(await fetchCategoryBySlug('unknown')).toBeNull()
  })
})

describe('fetchAllCategories', () => {
  beforeEach(() => vi.clearAllMocks())

  it('maps every returned category (tenant-scoped by payloadFetch itself)', async () => {
    vi.mocked(payloadFetch).mockResolvedValue(
      makeResult([
        { id: 2, slug: 'football' },
        { id: 3, slug: 'basketball' },
      ]),
    )

    const categories = await fetchAllCategories()

    expect(payloadFetch).toHaveBeenCalledWith(
      '/categories',
      expect.objectContaining({ limit: 100 }),
    )
    expect(categories).toEqual([{ slug: 'football' }, { slug: 'basketball' }])
  })
})
