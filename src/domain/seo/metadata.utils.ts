import type { Metadata } from 'next'
import type { Post } from '@/domain/post/post.model'
import type { Page } from '@/domain/page/page.model'
import type { Category } from '@/domain/category/category.model'
import type { Tag } from '@/domain/tag/tag.model'
import type { SiteConfig } from '@/lib/siteConfig'
import type { StaticPage } from '@/lib/staticPages'

/**
 * The one place canonical URLs are built. Strips any trailing slash from the
 * site URL, normalises the path, and appends `?page=N` for page ≥ 2 so every
 * paginated route self-canonicalises to its own page rather than to page 1.
 */
export const buildCanonicalUrl = (siteUrl: string, path: string, page = 1): string => {
  const base = siteUrl.replace(/\/+$/, '')
  const cleanPath = path === '/' ? '' : `/${path.replace(/^\/+/, '').replace(/\/+$/, '')}`
  const suffix = Number.isFinite(page) && page > 1 ? `?page=${Math.floor(page)}` : ''
  return `${base}${cleanPath}${suffix}`
}

export const generatePostMetadata = (post: Post, siteConfig: SiteConfig): Metadata => {
  const title = post.seo?.metaTitle ?? post.title
  const description = post.seo?.metaDescription ?? post.excerpt
  const ogImage = post.seo?.ogImage ?? post.featuredImage?.url ?? null

  return {
    title,
    description,
    alternates: { canonical: post.canonicalUrl },
    openGraph: {
      title,
      description,
      type: 'article',
      url: post.canonicalUrl,
      publishedTime: post.publishedAt.toISOString(),
      modifiedTime: post.modifiedAt.toISOString(),
      authors: [post.author.name],
      images: ogImage ? [{ url: ogImage, alt: title }] : [],
      siteName: siteConfig.siteName,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : [],
    },
  }
}

export const generateCategoryMetadata = (
  category: Category,
  siteConfig: SiteConfig,
  page = 1,
): Metadata => {
  const title = `${category.name} — ${siteConfig.siteName}`
  const description = category.description || `Últimas noticias y novedades de ${category.name}.`
  const canonical = buildCanonicalUrl(siteConfig.siteUrl, `/category/${category.slug}`, page)

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonical,
      siteName: siteConfig.siteName,
    },
  }
}

export const generateTagMetadata = (tag: Tag, siteConfig: SiteConfig, page = 1): Metadata => {
  const title = `${tag.name} — ${siteConfig.siteName}`
  const description = tag.description || `Últimos artículos etiquetados con ${tag.name}.`
  const canonical = buildCanonicalUrl(siteConfig.siteUrl, `/tag/${tag.slug}`, page)

  return {
    title,
    description,
    // Tag archives render the same list UI as category pages with no unique copy
    // and are near-duplicates of each other. Keep them crawlable for link
    // discovery (follow) but out of the index so they don't compete with posts
    // and categories for crawl budget. They are also excluded from the sitemap.
    robots: { index: false, follow: true },
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonical,
      siteName: siteConfig.siteName,
    },
  }
}

export const generatePageMetadata = (page: Page, siteConfig: SiteConfig): Metadata => {
  const title = page.seo?.metaTitle ?? page.title
  const description = page.seo?.metaDescription ?? ''
  const ogImage = page.seo?.ogImage ?? null

  return {
    title,
    description,
    alternates: { canonical: buildCanonicalUrl(siteConfig.siteUrl, `/page/${page.slug}`) },
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: siteConfig.siteName,
      images: ogImage ? [{ url: ogImage }] : [],
    },
  }
}

export const generateStaticPageMetadata = (
  page: StaticPage,
  description: string,
  siteConfig: SiteConfig,
): Metadata => ({
  title: page.title,
  description,
  alternates: { canonical: buildCanonicalUrl(siteConfig.siteUrl, page.href) },
  openGraph: {
    title: page.title,
    description,
    type: 'website',
    url: buildCanonicalUrl(siteConfig.siteUrl, page.href),
    siteName: siteConfig.siteName,
  },
})
