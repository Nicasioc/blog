import type { MetadataRoute } from 'next'
import {
  fetchAllPostSlugs,
  fetchPostCountByCategory,
} from '@/persistence/payload/repositories/postRepository'
import { fetchAllPageSlugs } from '@/persistence/payload/repositories/pageRepository'
import { fetchAllCategories } from '@/persistence/payload/repositories/categoryRepository'
import { archivePageCount } from '@/domain/shared/pagination.model'
import { siteConfig } from '@/lib/siteConfig'
import { STATIC_PAGES } from '@/lib/staticPages'
import { latestDate } from '@/utils/date'

export const revalidate = 86400

type Entry = MetadataRoute.Sitemap[number]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Normalised (no trailing slash) — see siteConfig.
  const siteUrl = siteConfig.siteUrl
  const buildTime = new Date()

  // The mappers use the epoch as "no usable date". Surfacing 1970 in <lastmod>
  // would be the very signal problem this work exists to fix, so epoch (and any
  // invalid Date) collapses back to build time.
  const lastModifiedOr = (date: Date): Date =>
    Number.isNaN(date.getTime()) || date.getTime() === 0 ? buildTime : date

  // Archive pagination uses `?page=N` (see the Pagination component). Page 1 is
  // the bare archive URL, already listed, so this yields pages 2..N.
  const paginatedArchiveUrls = (path: string, totalItems: number, lastModified: Date): Entry[] => {
    const pageCount = archivePageCount(totalItems)
    return Array.from({ length: pageCount - 1 }, (_, i) => ({
      url: `${siteUrl}${path}?page=${i + 2}`,
      lastModified,
      changeFrequency: 'daily' as const,
      priority: 0.4,
    }))
  }

  const [posts, pages, categories] = await Promise.all([
    fetchAllPostSlugs(),
    fetchAllPageSlugs(),
    fetchAllCategories(),
  ])

  const categoryPostCounts = await Promise.all(
    categories.map((category) => fetchPostCountByCategory(category.id)),
  )

  // Home and /blog change whenever any post does.
  const latestPostDate = lastModifiedOr(
    latestDate(
      posts.map(({ updatedAt }) => updatedAt),
      buildTime,
    ),
  )

  return [
    {
      url: siteUrl,
      lastModified: latestPostDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: latestPostDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...paginatedArchiveUrls('/blog', posts.length, latestPostDate),
    ...STATIC_PAGES.map(({ href }) => ({
      url: `${siteUrl}${href}`,
      // Legal/info pages ship with the build; they have no CMS record to date from.
      lastModified: buildTime,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    })),
    ...posts.map(({ slug, updatedAt }) => ({
      url: `${siteUrl}/blog/${slug}`,
      lastModified: lastModifiedOr(updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...categories.flatMap(({ slug, updatedAt }, index): Entry[] => {
      const lastModified = lastModifiedOr(updatedAt)
      return [
        {
          url: `${siteUrl}/category/${slug}`,
          lastModified,
          changeFrequency: 'daily' as const,
          priority: 0.6,
        },
        ...paginatedArchiveUrls(`/category/${slug}`, categoryPostCounts[index] ?? 0, lastModified),
      ]
    }),
    ...pages.map(({ slug, updatedAt }) => ({
      url: `${siteUrl}/page/${slug}`,
      lastModified: lastModifiedOr(updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
  ]
}
