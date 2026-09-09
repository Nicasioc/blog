import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/siteConfig', () => ({
  siteConfig: { siteUrl: 'https://site.example.com' },
}))

vi.mock('@/persistence/payload/repositories/postRepository', () => ({
  fetchAllPostSlugs: vi.fn(),
  fetchPostCountByCategory: vi.fn(),
}))
vi.mock('@/persistence/payload/repositories/pageRepository', () => ({
  fetchAllPageSlugs: vi.fn(),
}))
vi.mock('@/persistence/payload/repositories/categoryRepository', () => ({
  fetchAllCategories: vi.fn(),
}))

import sitemap from './sitemap'
import {
  fetchAllPostSlugs,
  fetchPostCountByCategory,
} from '@/persistence/payload/repositories/postRepository'
import { fetchAllPageSlugs } from '@/persistence/payload/repositories/pageRepository'
import { fetchAllCategories } from '@/persistence/payload/repositories/categoryRepository'

const post = (slug: string, updatedAt: Date) => ({ slug, updatedAt })
const category = (slug: string, updatedAt: Date) => ({
  id: 1,
  slug,
  name: slug,
  description: '',
  postCount: 0,
  updatedAt,
})

const entryFor = (entries: Awaited<ReturnType<typeof sitemap>>, url: string) => {
  const match = entries.find((e) => e.url === url)
  if (!match) throw new Error(`no sitemap entry for ${url}`)
  return match
}

describe('sitemap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fetchAllPostSlugs).mockResolvedValue([])
    vi.mocked(fetchAllPageSlugs).mockResolvedValue([])
    vi.mocked(fetchAllCategories).mockResolvedValue([])
    vi.mocked(fetchPostCountByCategory).mockResolvedValue(0)
  })

  it('emits a valid lastModified Date on every entry', async () => {
    vi.mocked(fetchAllPostSlugs).mockResolvedValue([
      post('a', new Date('2026-01-01T00:00:00.000Z')),
      post('b', new Date('2026-02-01T00:00:00.000Z')),
    ])
    vi.mocked(fetchAllPageSlugs).mockResolvedValue([
      post('about', new Date('2026-01-15T00:00:00.000Z')),
    ])
    vi.mocked(fetchAllCategories).mockResolvedValue([
      category('plantel', new Date('2026-01-20T00:00:00.000Z')),
    ])

    const entries = await sitemap()

    expect(entries.length).toBeGreaterThan(0)
    for (const entry of entries) {
      expect(entry.lastModified).toBeInstanceOf(Date)
      expect(Number.isNaN((entry.lastModified as Date).getTime())).toBe(false)
      expect((entry.lastModified as Date).getTime()).toBeGreaterThan(0)
    }
  })

  it('dates the homepage and /blog from the most recent post', async () => {
    vi.mocked(fetchAllPostSlugs).mockResolvedValue([
      post('a', new Date('2026-01-01T00:00:00.000Z')),
      post('b', new Date('2026-06-30T00:00:00.000Z')),
      post('c', new Date('2026-03-01T00:00:00.000Z')),
    ])

    const entries = await sitemap()

    const expected = new Date('2026-06-30T00:00:00.000Z')
    expect(entryFor(entries, 'https://site.example.com').lastModified).toEqual(expected)
    expect(entryFor(entries, 'https://site.example.com/blog').lastModified).toEqual(expected)
  })

  it('uses each post/category/page own updatedAt for its URL', async () => {
    vi.mocked(fetchAllPostSlugs).mockResolvedValue([
      post('gol', new Date('2026-05-05T00:00:00.000Z')),
    ])
    vi.mocked(fetchAllCategories).mockResolvedValue([
      category('plantel', new Date('2026-04-04T00:00:00.000Z')),
    ])
    vi.mocked(fetchAllPageSlugs).mockResolvedValue([
      post('contact', new Date('2026-03-03T00:00:00.000Z')),
    ])

    const entries = await sitemap()

    expect(entryFor(entries, 'https://site.example.com/blog/gol').lastModified).toEqual(
      new Date('2026-05-05T00:00:00.000Z'),
    )
    expect(entryFor(entries, 'https://site.example.com/category/plantel').lastModified).toEqual(
      new Date('2026-04-04T00:00:00.000Z'),
    )
    expect(entryFor(entries, 'https://site.example.com/page/contact').lastModified).toEqual(
      new Date('2026-03-03T00:00:00.000Z'),
    )
  })

  it('falls back to build time when a date is the epoch (unknown) or collections are empty', async () => {
    const before = Date.now()
    vi.mocked(fetchAllPostSlugs).mockResolvedValue([post('mystery', new Date(0))])
    vi.mocked(fetchAllCategories).mockResolvedValue([category('plantel', new Date(0))])

    const entries = await sitemap()
    const after = Date.now()

    const withinBuildWindow = (d: Date) => d.getTime() >= before && d.getTime() <= after + 1000

    // epoch post → build time
    expect(
      withinBuildWindow(
        entryFor(entries, 'https://site.example.com/blog/mystery').lastModified as Date,
      ),
    ).toBe(true)
    // epoch category → build time
    expect(
      withinBuildWindow(
        entryFor(entries, 'https://site.example.com/category/plantel').lastModified as Date,
      ),
    ).toBe(true)
    // no valid post dates → home falls back to build time
    expect(
      withinBuildWindow(entryFor(entries, 'https://site.example.com').lastModified as Date),
    ).toBe(true)
  })

  it('lists page 2..N of the /blog archive but not page 1 twice', async () => {
    // 25 posts at page size 10 -> 3 pages
    vi.mocked(fetchAllPostSlugs).mockResolvedValue(
      Array.from({ length: 25 }, (_, i) => post(`p${i}`, new Date('2026-01-01T00:00:00.000Z'))),
    )

    const urls = (await sitemap()).map((e) => e.url)

    expect(urls).toContain('https://site.example.com/blog')
    expect(urls).toContain('https://site.example.com/blog?page=2')
    expect(urls).toContain('https://site.example.com/blog?page=3')
    expect(urls).not.toContain('https://site.example.com/blog?page=1')
    expect(urls).not.toContain('https://site.example.com/blog?page=4')
  })

  it('lists paginated category archive URLs based on the category post count', async () => {
    vi.mocked(fetchAllCategories).mockResolvedValue([
      category('plantel', new Date('2026-01-01T00:00:00.000Z')),
      category('humor', new Date('2026-01-01T00:00:00.000Z')),
    ])
    // plantel: 21 posts -> 3 pages; humor: 4 posts -> 1 page
    vi.mocked(fetchPostCountByCategory).mockResolvedValueOnce(21).mockResolvedValueOnce(4)

    const urls = (await sitemap()).map((e) => e.url)

    expect(urls).toContain('https://site.example.com/category/plantel')
    expect(urls).toContain('https://site.example.com/category/plantel?page=2')
    expect(urls).toContain('https://site.example.com/category/plantel?page=3')
    expect(urls).not.toContain('https://site.example.com/category/plantel?page=4')
    expect(urls).toContain('https://site.example.com/category/humor')
    expect(urls).not.toContain('https://site.example.com/category/humor?page=2')
  })

  it('always includes the static legal pages', async () => {
    const entries = await sitemap()
    const urls = entries.map((e) => e.url)
    expect(urls).toContain('https://site.example.com/privacy')
    expect(urls).toContain('https://site.example.com/terms')
  })
})
