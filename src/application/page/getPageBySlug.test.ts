import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getPageBySlug } from './getPageBySlug'

vi.mock('@/persistence/payload/repositories/pageRepository', () => ({
  fetchPageBySlug: vi.fn(),
}))

import { fetchPageBySlug } from '@/persistence/payload/repositories/pageRepository'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makePage = (slug: string) => ({ id: 1, slug, title: 'Page' }) as any

describe('getPageBySlug', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null when page is not found', async () => {
    vi.mocked(fetchPageBySlug).mockResolvedValue(null)
    const result = await getPageBySlug('missing')
    expect(result).toBeNull()
  })

  it('returns the page when found', async () => {
    const page = makePage('about')
    vi.mocked(fetchPageBySlug).mockResolvedValue(page)
    const result = await getPageBySlug('about')
    expect(result).toEqual(page)
  })
})
