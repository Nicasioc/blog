import type { MetadataRoute } from 'next'
import { fetchAllPostSlugs } from '@/persistence/payload/repositories/postRepository'
import { fetchAllPageSlugs } from '@/persistence/payload/repositories/pageRepository'
import { fetchAllCategories } from '@/persistence/payload/repositories/categoryRepository'
import { clientEnv } from '@/lib/env.client'
import { STATIC_PAGES } from '@/lib/staticPages'

export const revalidate = 86400

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = clientEnv.NEXT_PUBLIC_SITE_URL

  const [postSlugs, pageSlugs, categories] = await Promise.all([
    fetchAllPostSlugs(),
    fetchAllPageSlugs(),
    fetchAllCategories(),
  ])

  return [
    { url: siteUrl, changeFrequency: 'daily', priority: 1.0 },
    { url: `${siteUrl}/blog`, changeFrequency: 'daily', priority: 0.9 },
    ...STATIC_PAGES.map(({ href }) => ({
      url: `${siteUrl}${href}`,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    })),
    ...postSlugs.map(({ slug }) => ({
      url: `${siteUrl}/blog/${slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...categories.map(({ slug }) => ({
      url: `${siteUrl}/category/${slug}`,
      changeFrequency: 'daily' as const,
      priority: 0.6,
    })),
    ...pageSlugs.map(({ slug }) => ({
      url: `${siteUrl}/page/${slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
  ]
}
