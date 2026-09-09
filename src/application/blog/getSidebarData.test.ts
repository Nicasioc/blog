import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getSidebarData } from './getSidebarData'

vi.mock('@/persistence/payload/repositories/categoryRepository', () => ({
  fetchAllCategories: vi.fn(),
}))

import { fetchAllCategories } from '@/persistence/payload/repositories/categoryRepository'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeCategory = (id: number) => ({ id, slug: `category-${id}`, name: `Category ${id}` }) as any

describe('getSidebarData', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns the fetched categories', async () => {
    const categories = [makeCategory(1), makeCategory(2)]
    vi.mocked(fetchAllCategories).mockResolvedValue(categories)

    const result = await getSidebarData()

    expect(result).toEqual({ categories })
  })

  it('returns an empty list when there are no categories', async () => {
    vi.mocked(fetchAllCategories).mockResolvedValue([])

    const result = await getSidebarData()

    expect(result).toEqual({ categories: [] })
  })
})
