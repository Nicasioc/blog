import type { MetadataRoute } from 'next'
import { fetchAllPostSlugs } from '@/persistence/payload/repositories/postRepository'
import { fetchAllPageSlugs } from '@/persistence/payload/repositories/pageRepository'
import { fetchAllCategories } from '@/persistence/payload/repositories/categoryRepository'
import { clientEnv } from '@/lib/env.client'
import { STATIC_PAGES } from '@/lib/staticPages'
import { latestDate } from '@/utils/date'

export const revalidate = 86400

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = clientEnv.NEXT_PUBLIC_SITE_URL
  const buildTime = new Date()

  // The mappers use the epoch as "no usable date". Surfacing 1970 in <lastmod>
  // would be the very signal problem this work exists to fix, so epoch (and any
  // invalid Date) collapses back to build time.
  const lastModifiedOr = (date: Date): Date =>
    Number.isNaN(date.getTime()) || date.getTime() === 0 ? buildTime : date

  const [posts, pages, categories] = await Promise.all([
    fetchAllPostSlugs(),
    fetchAllPageSlugs(),
    fetchAllCategories(),
  ])

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
    ...categories.map(({ slug, updatedAt }) => ({
      url: `${siteUrl}/category/${slug}`,
      lastModified: lastModifiedOr(updatedAt),
      changeFrequency: 'daily' as const,
      priority: 0.6,
    })),
    ...pages.map(({ slug, updatedAt }) => ({
      url: `${siteUrl}/page/${slug}`,
      lastModified: lastModifiedOr(updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
  ]
}
