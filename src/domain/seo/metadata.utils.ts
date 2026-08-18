import type { Metadata } from 'next'
import type { Post } from '@/domain/post/post.model'
import type { Page } from '@/domain/page/page.model'
import type { Category } from '@/domain/category/category.model'
import type { Tag } from '@/domain/tag/tag.model'
import type { SiteConfig } from '@/lib/siteConfig'
import type { StaticPage } from '@/lib/staticPages'

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

export const generateCategoryMetadata = (category: Category, siteConfig: SiteConfig): Metadata => {
  const title = `${category.name} — ${siteConfig.siteName}`
  const description = category.description || `Últimas noticias y novedades de ${category.name}.`

  return {
    title,
    description,
    alternates: { canonical: `${siteConfig.siteUrl}/category/${category.slug}` },
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: siteConfig.siteName,
    },
  }
}

export const generateTagMetadata = (tag: Tag, siteConfig: SiteConfig): Metadata => {
  const title = `${tag.name} — ${siteConfig.siteName}`
  const description = tag.description || `Últimos artículos etiquetados con ${tag.name}.`

  return {
    title,
    description,
    alternates: { canonical: `${siteConfig.siteUrl}/tag/${tag.slug}` },
    openGraph: {
      title,
      description,
      type: 'website',
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
    alternates: { canonical: `${siteConfig.siteUrl}/page/${page.slug}` },
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
  alternates: { canonical: `${siteConfig.siteUrl}${page.href}` },
  openGraph: {
    title: page.title,
    description,
    type: 'website',
    url: `${siteConfig.siteUrl}${page.href}`,
    siteName: siteConfig.siteName,
  },
})
