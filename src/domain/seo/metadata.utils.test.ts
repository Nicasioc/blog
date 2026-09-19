import { describe, it, expect } from 'vitest'
import {
  buildCanonicalUrl,
  generatePostMetadata,
  generateCategoryMetadata,
  generateTagMetadata,
  generatePageMetadata,
  generateStaticPageMetadata,
} from '@/domain/seo/metadata.utils'
import type { Post } from '@/domain/post/post.model'
import type { Page } from '@/domain/page/page.model'
import type { Category } from '@/domain/category/category.model'
import type { Tag } from '@/domain/tag/tag.model'
import type { SiteConfig } from '@/lib/siteConfig'

const mockSiteConfig: SiteConfig = {
  siteName: 'Test FC News',
  siteUrl: 'https://testfc.com',
  logoUrl: '/logo.svg',
  contactEmail: 'hola@testfc.com',
  theme: { primary: '#ffffff', secondary: '#000000', primaryForeground: '#000000' },
  ads: {
    provider: 'adsense',
    adSensePublisherId: undefined,
    slots: { 'header-leaderboard': '', 'in-content': '', sidebar: '', footer: '' },
  },
}

const mockPost: Post = {
  id: 1,
  slug: 'test-post',
  title: 'Test Post Title',
  excerpt: 'This is the excerpt.',
  content: '<p>Content</p>',
  publishedAt: new Date('2024-01-01'),
  modifiedAt: new Date('2024-01-02'),
  featured: false,
  featuredImage: { url: 'https://example.com/img.jpg', alt: 'Image', width: 1200, height: 630 },
  author: {
    id: 1,
    slug: 'author',
    name: 'Author Name',
    description: '',
    avatarUrl: null,
    profileUrl: '',
  },
  categories: [],
  tags: [],
  canonicalUrl: 'https://testfc.com/blog/test-post',
  seo: null,
}

describe('buildCanonicalUrl', () => {
  it('joins the site URL and path', () => {
    expect(buildCanonicalUrl('https://testfc.com', '/blog/hello')).toBe(
      'https://testfc.com/blog/hello',
    )
  })

  it('returns the bare site URL for the root path', () => {
    expect(buildCanonicalUrl('https://testfc.com', '/')).toBe('https://testfc.com')
  })

  it('strips a trailing slash from the site URL', () => {
    expect(buildCanonicalUrl('https://testfc.com/', '/blog')).toBe('https://testfc.com/blog')
  })

  it('omits the page query for page 1 and adds it for page >= 2', () => {
    expect(buildCanonicalUrl('https://testfc.com', '/category/x', 1)).toBe(
      'https://testfc.com/category/x',
    )
    expect(buildCanonicalUrl('https://testfc.com', '/category/x', 3)).toBe(
      'https://testfc.com/category/x?page=3',
    )
  })

  it('tolerates a malformed page value', () => {
    expect(buildCanonicalUrl('https://testfc.com', '/blog', Number.NaN)).toBe(
      'https://testfc.com/blog',
    )
  })
})

describe('generatePostMetadata', () => {
  it('falls back to post title and excerpt when seo is null', () => {
    const meta = generatePostMetadata(mockPost, mockSiteConfig)
    expect(meta.title).toBe('Test Post Title')
    expect(meta.description).toBe('This is the excerpt.')
  })

  it('uses Yoast meta title and description when seo is present', () => {
    const post: Post = {
      ...mockPost,
      seo: { metaTitle: 'Yoast Title', metaDescription: 'Yoast Desc', ogImage: null },
    }
    const meta = generatePostMetadata(post, mockSiteConfig)
    expect(meta.title).toBe('Yoast Title')
    expect(meta.description).toBe('Yoast Desc')
  })

  it('sets canonical URL', () => {
    const meta = generatePostMetadata(mockPost, mockSiteConfig)
    expect(meta.alternates?.canonical).toBe('https://testfc.com/blog/test-post')
  })

  it('leaves robots unset so posts stay indexable', () => {
    const meta = generatePostMetadata(mockPost, mockSiteConfig)
    expect(meta.robots).toBeUndefined()
  })

  it('includes featured image in OG when present', () => {
    const meta = generatePostMetadata(mockPost, mockSiteConfig)
    expect((meta.openGraph?.images as Array<{ url: string }>)[0].url).toBe(
      'https://example.com/img.jpg',
    )
  })

  it('has empty OG images when no featured image and no Yoast ogImage', () => {
    const post: Post = { ...mockPost, featuredImage: null }
    const meta = generatePostMetadata(post, mockSiteConfig)
    expect(meta.openGraph?.images).toEqual([])
  })

  it('prefers Yoast ogImage over featured image', () => {
    const post: Post = {
      ...mockPost,
      seo: { metaTitle: 'T', metaDescription: 'D', ogImage: 'https://yoast.com/og.jpg' },
    }
    const meta = generatePostMetadata(post, mockSiteConfig)
    expect((meta.openGraph?.images as Array<{ url: string }>)[0].url).toBe(
      'https://yoast.com/og.jpg',
    )
  })

  it('includes twitter card metadata', () => {
    const meta = generatePostMetadata(mockPost, mockSiteConfig)
    expect((meta.twitter as { card?: string })?.card).toBe('summary_large_image')
  })
})

describe('generateCategoryMetadata', () => {
  const category: Category = {
    id: 5,
    slug: 'transfers',
    name: 'Transfers',
    description: 'Transfer news.',
    postCount: 42,
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  }

  it('builds title from category name and site name', () => {
    const meta = generateCategoryMetadata(category, mockSiteConfig)
    expect(meta.title).toBe('Transfers — Test FC News')
  })

  it('uses category description when present', () => {
    const meta = generateCategoryMetadata(category, mockSiteConfig)
    expect(meta.description).toBe('Transfer news.')
  })

  it('falls back to generic description when category description is empty', () => {
    const meta = generateCategoryMetadata({ ...category, description: '' }, mockSiteConfig)
    expect(meta.description).toBe('Últimas noticias y novedades de Transfers.')
  })

  it('sets a self-referencing canonical URL', () => {
    const meta = generateCategoryMetadata(category, mockSiteConfig)
    expect(meta.alternates?.canonical).toBe('https://testfc.com/category/transfers')
  })

  it('makes the canonical page-aware for page >= 2', () => {
    const meta = generateCategoryMetadata(category, mockSiteConfig, 3)
    expect(meta.alternates?.canonical).toBe('https://testfc.com/category/transfers?page=3')
    expect(meta.openGraph && 'url' in meta.openGraph && meta.openGraph.url).toBe(
      'https://testfc.com/category/transfers?page=3',
    )
  })

  it('leaves robots unset so category pages stay indexable', () => {
    const meta = generateCategoryMetadata(category, mockSiteConfig)
    expect(meta.robots).toBeUndefined()
  })
})

describe('generateTagMetadata', () => {
  const tag: Tag = {
    id: 3,
    slug: 'champions-league',
    name: 'Champions League',
    description: '',
    postCount: 10,
  }

  it('builds title from tag name and site name', () => {
    const meta = generateTagMetadata(tag, mockSiteConfig)
    expect(meta.title).toBe('Champions League — Test FC News')
  })

  it('falls back to generic description when tag description is empty', () => {
    const meta = generateTagMetadata(tag, mockSiteConfig)
    expect(meta.description).toBe('Últimos artículos etiquetados con Champions League.')
  })

  it('sets a self-referencing canonical URL, page-aware', () => {
    expect(generateTagMetadata(tag, mockSiteConfig).alternates?.canonical).toBe(
      'https://testfc.com/tag/champions-league',
    )
    expect(generateTagMetadata(tag, mockSiteConfig, 2).alternates?.canonical).toBe(
      'https://testfc.com/tag/champions-league?page=2',
    )
  })

  it('marks tag archives noindex, follow', () => {
    const meta = generateTagMetadata(tag, mockSiteConfig)
    expect(meta.robots).toEqual({ index: false, follow: true })
  })
})

describe('generatePageMetadata', () => {
  const page: Page = {
    id: 2,
    slug: 'about',
    title: 'About Us',
    content: '<p>About</p>',
    modifiedAt: new Date('2024-06-01'),
    seo: null,
  }

  it('falls back to page title when seo is null', () => {
    const meta = generatePageMetadata(page, mockSiteConfig)
    expect(meta.title).toBe('About Us')
  })

  it('uses Yoast title when seo is present', () => {
    const meta = generatePageMetadata(
      { ...page, seo: { metaTitle: 'Yoast About', metaDescription: 'Desc', ogImage: null } },
      mockSiteConfig,
    )
    expect(meta.title).toBe('Yoast About')
  })

  it('sets canonical URL', () => {
    const meta = generatePageMetadata(page, mockSiteConfig)
    expect(meta.alternates?.canonical).toBe('https://testfc.com/page/about')
  })
})

describe('generateStaticPageMetadata', () => {
  const page = { href: '/privacy', title: 'Política de Privacidad' }

  it('uses the page title and the provided description', () => {
    const meta = generateStaticPageMetadata(page, 'Cómo tratamos tus datos.', mockSiteConfig)
    expect(meta.title).toBe('Política de Privacidad')
    expect(meta.description).toBe('Cómo tratamos tus datos.')
  })

  it('builds the canonical url from the site url and the page href', () => {
    const meta = generateStaticPageMetadata(page, 'desc', mockSiteConfig)
    expect(meta.alternates?.canonical).toBe('https://testfc.com/privacy')
  })

  it('exposes an open graph object pointing at the canonical url', () => {
    const meta = generateStaticPageMetadata(page, 'desc', mockSiteConfig)
    expect(meta.openGraph?.siteName).toBe('Test FC News')
    expect(meta.openGraph?.url).toBe('https://testfc.com/privacy')
    expect(meta.openGraph?.title).toBe('Política de Privacidad')
  })
})
