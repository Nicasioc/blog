# Phase 5: Routes & SEO

## Context

Phase 5 wires up all Next.js App Router routes, the root layout, JSON-LD structured-data components, sitemap, robots.txt, and an ISR webhook endpoint. Routes fully implement metadata/generateStaticParams/revalidate. Render content is placeholder — Phase 6 replaces it with real UI components.

**Gotcha — Next.js 15+ async params:** In Next.js 15+, `params` and `searchParams` props are Promises. All page/layout components that use them must `await` them.

---

## New env var

Add `REVALIDATE_SECRET` to `src/lib/env.ts` serverSchema and `.env.example`. Used to authenticate the ISR webhook from WordPress.

```
# src/lib/env.ts serverSchema addition:
REVALIDATE_SECRET: z.string().min(16)

# .env.example addition:
REVALIDATE_SECRET=your-random-secret-32-chars-minimum
```

---

## File Structure

```
src/
└── components/seo/
    ├── PostJsonLd.tsx
    └── BreadcrumbJsonLd.tsx

app/
├── layout.tsx                    ← update (font + metadata + CSS vars + AdSense)
├── page.tsx                      ← homepage
├── blog/
│   ├── page.tsx                  ← blog listing
│   └── [slug]/
│       └── page.tsx              ← post detail
├── category/
│   └── [slug]/
│       └── page.tsx
├── tag/
│   └── [slug]/
│       └── page.tsx
├── page/
│   └── [slug]/
│       └── page.tsx              ← WP static pages
├── api/
│   └── revalidate/
│       └── route.ts              ← ISR webhook
├── sitemap.ts
└── robots.ts
```

---

## Step 1 — Root Layout (`app/layout.tsx`)

```typescript
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { siteConfig } from '@/lib/siteConfig'
import { clientEnv } from '@/lib/env'
import '@/app/globals.css'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(clientEnv.NEXT_PUBLIC_SITE_URL),
  title: {
    default: siteConfig.siteName,
    template: `%s | ${siteConfig.siteName}`,
  },
  description: `${siteConfig.siteName} — latest news and updates`,
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { primary, secondary } = siteConfig.theme

  return (
    <html lang="en" className={inter.className}>
      <head>
        <style>{`
          :root {
            --brand-primary: ${primary};
            --brand-secondary: ${secondary};
          }
        `}</style>
      </head>
      <body>
        {children}
        {siteConfig.adProvider === 'adsense' && siteConfig.adSensePublisherId && (
          <Script
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${siteConfig.adSensePublisherId}`}
            strategy="afterInteractive"
            crossOrigin="anonymous"
          />
        )}
      </body>
    </html>
  )
}
```

---

## Step 2 — JSON-LD Server Components (`src/components/seo/`)

### `PostJsonLd.tsx`

```typescript
import type { Post } from '@/domain/post/post.model'
import { siteConfig } from '@/lib/siteConfig'

type Props = { post: Post }

export const PostJsonLd = ({ post }: Props) => {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt.toISOString(),
    dateModified: post.modifiedAt.toISOString(),
    author: { '@type': 'Person', name: post.author.name },
    publisher: { '@type': 'Organization', name: siteConfig.siteName },
    ...(post.featuredImage && { image: post.featuredImage.url }),
    url: post.canonicalUrl,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
```

### `BreadcrumbJsonLd.tsx`

```typescript
type BreadcrumbItem = { name: string; url: string }
type Props = { items: BreadcrumbItem[] }

export const BreadcrumbJsonLd = ({ items }: Props) => {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
```

---

## Step 3 — Route Pages

### `app/page.tsx` — Homepage

```typescript
import { getHomepageData } from '@/application/blog/getHomepageData'

export const revalidate = 1800

export default async function HomePage() {
  const data = await getHomepageData()
  // Phase 6: replace with <HomepageLayout data={data} />
  return <main>{JSON.stringify({ postCount: data.recentPosts.length })}</main>
}
```

### `app/blog/page.tsx` — Blog listing

```typescript
import type { Metadata } from 'next'
import { getPostsList } from '@/application/blog/getPostsList'
import { siteConfig } from '@/lib/siteConfig'

export const revalidate = 1800

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Blog', description: `Latest posts from ${siteConfig.siteName}` }
}

type Props = { searchParams: Promise<{ page?: string }> }

export default async function BlogPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam ?? '1'))
  const data = await getPostsList({ page })
  // Phase 6: replace with <PostList posts={data.posts} pagination={data.pagination} />
  return <main>{JSON.stringify({ page: data.pagination.currentPage })}</main>
}
```

### `app/blog/[slug]/page.tsx` — Post detail

```typescript
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPostBySlug } from '@/application/blog/getPostBySlug'
import { fetchAllPostSlugs } from '@/persistence/wordpress/repositories/postRepository'
import { generatePostMetadata } from '@/domain/seo/metadata.utils'
import { siteConfig } from '@/lib/siteConfig'
import { PostJsonLd } from '@/components/seo/PostJsonLd'
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd'
import { clientEnv } from '@/lib/env'

export const revalidate = 3600

export async function generateStaticParams() {
  return fetchAllPostSlugs()  // [{ slug: 'post-1' }, ...]
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const result = await getPostBySlug(slug)
  if (!result) return {}
  return generatePostMetadata(result.post, siteConfig)
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params
  const result = await getPostBySlug(slug)
  if (!result) notFound()

  const { post, relatedPosts, comments } = result
  const siteUrl = clientEnv.NEXT_PUBLIC_SITE_URL

  return (
    <>
      <PostJsonLd post={post} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: siteUrl },
          { name: 'Blog', url: `${siteUrl}/blog` },
          { name: post.title, url: post.canonicalUrl },
        ]}
      />
      {/* Phase 6: replace with full layout including:
          <PostBody content={post.content} />
          <CommentList comments={comments} />
          <CommentForm postId={post.id} />
      */}
      <main>{post.title}</main>
    </>
  )
}
```

**Note on `generateStaticParams`:** `fetchAllPostSlugs` is imported directly from the repository — the only place a route file may do this, and only for `generateStaticParams`. All data-fetching in the page body still goes via the application layer.

### `app/category/[slug]/page.tsx` — Category archive

```typescript
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCategoryArchive } from '@/application/blog/getCategoryArchive'
import { generateCategoryMetadata } from '@/domain/seo/metadata.utils'
import { siteConfig } from '@/lib/siteConfig'
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd'
import { clientEnv } from '@/lib/env'

export const revalidate = 3600

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const data = await getCategoryArchive({ slug })
  if (!data) return {}
  return generateCategoryMetadata(data.category, siteConfig)
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam ?? '1'))

  const data = await getCategoryArchive({ slug, page })
  if (!data) notFound()

  const siteUrl = clientEnv.NEXT_PUBLIC_SITE_URL

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: siteUrl },
          { name: data.category.name, url: `${siteUrl}/category/${slug}` },
        ]}
      />
      {/* Phase 6: replace with <CategoryArchiveLayout data={data} /> */}
      <main>{data.category.name}</main>
    </>
  )
}
```

### `app/tag/[slug]/page.tsx` — Tag archive

```typescript
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTagArchive } from '@/application/blog/getTagArchive'
import { generateTagMetadata } from '@/domain/seo/metadata.utils'
import { siteConfig } from '@/lib/siteConfig'

export const revalidate = 3600

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const data = await getTagArchive({ slug })
  if (!data) return {}
  return generateTagMetadata(data.tag, siteConfig)
}

export default async function TagPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam ?? '1'))

  const data = await getTagArchive({ slug, page })
  if (!data) notFound()

  return (
    <main>{data.tag.name}</main>  // Phase 6: replace with full layout
  )
}
```

### `app/page/[slug]/page.tsx` — WP static pages

```typescript
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPageBySlug } from '@/application/page/getPageBySlug'
import { fetchAllPageSlugs } from '@/persistence/wordpress/repositories/pageRepository'
import { generatePageMetadata } from '@/domain/seo/metadata.utils'
import { siteConfig } from '@/lib/siteConfig'

export const revalidate = 86400

export async function generateStaticParams() {
  return fetchAllPageSlugs()
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = await getPageBySlug(slug)
  if (!page) return {}
  return generatePageMetadata(page, siteConfig)
}

export default async function WpStaticPage({ params }: Props) {
  const { slug } = await params
  const page = await getPageBySlug(slug)
  if (!page) notFound()

  return (
    <main>{page.title}</main>  // Phase 6: replace with full layout
  )
}
```

---

## Step 4 — ISR Webhook (`app/api/revalidate/route.ts`)

Called by a WordPress webhook on post publish/update. Triggers on-demand revalidation.

```typescript
import { revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { serverEnv } from '@/lib/env'

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')

  if (secret !== serverEnv.REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const slug = typeof body?.slug === 'string' ? body.slug : undefined

  if (slug) {
    revalidateTag(`post-${slug}`)
  }
  revalidateTag('posts')

  return NextResponse.json({ revalidated: true, slug: slug ?? 'all' })
}
```

**WordPress setup:** Add a WP hook that POSTs to `https://yoursite.com/api/revalidate?secret=REVALIDATE_SECRET` with `{ "slug": "post-slug" }` on `save_post`.

---

## Step 5 — Sitemap (`app/sitemap.ts`)

```typescript
import type { MetadataRoute } from 'next'
import { fetchAllPostSlugs } from '@/persistence/wordpress/repositories/postRepository'
import { fetchAllPageSlugs } from '@/persistence/wordpress/repositories/pageRepository'
import { fetchAllCategories } from '@/persistence/wordpress/repositories/categoryRepository'
import { clientEnv } from '@/lib/env'

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
```

---

## Step 6 — Robots (`app/robots.ts`)

```typescript
import type { MetadataRoute } from 'next'
import { clientEnv } from '@/lib/env'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = clientEnv.NEXT_PUBLIC_SITE_URL
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/api/' },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
```

---

## Verification Checklist

1. `npm run build` — zero TypeScript errors; all routes compile
2. `npm start` — visit `/`, `/blog`, `/blog/[slug]`, `/category/[slug]`, `/sitemap.xml`, `/robots.txt` — all respond
3. View source on a post page — confirm `<script type="application/ld+json">` present with Article schema
4. Check `<head>` — confirm `<title>` uses template and OG tags present
5. `curl -X POST "http://localhost:3000/api/revalidate?secret=WRONG"` → 401
6. `curl -X POST "http://localhost:3000/api/revalidate?secret=CORRECT" -d '{"slug":"test"}'` → `{ revalidated: true }`
7. `npm run typecheck` — zero errors

---

## Definition of Done

- Root layout: Inter font loaded, CSS vars injected, AdSense script wired, base metadata exported
- All 7 routes with correct `revalidate`, `generateMetadata`, `generateStaticParams` where applicable
- `notFound()` called when application layer returns `null`
- `PostJsonLd` and `BreadcrumbJsonLd` rendered on post/category pages
- `/sitemap.xml` returns valid XML with post/page/category URLs
- `/robots.txt` disallows `/api/` and references sitemap
- ISR webhook returns 401 on bad secret, `{ revalidated: true }` on success
- `REVALIDATE_SECRET` added to `serverEnv` schema and `.env.example`

---

## Key Gotchas

| Area                    | Issue                                          | Fix                                                             |
| ----------------------- | ---------------------------------------------- | --------------------------------------------------------------- |
| Next.js 15+ params      | `params` and `searchParams` are Promises       | Always `await params` / `await searchParams` in page components |
| `generateStaticParams`  | Only place a route may import from persistence | Acceptable exception — all other fetching via application layer |
| Sitemap on Vercel       | Sitemap regenerates via ISR                    | `revalidate = 86400` regenerates it daily                       |
| JSON-LD                 | Never embed raw HTML in JSON-LD strings        | `post.excerpt` is already stripped by postMapper                |
| AdSense script          | Crashes on server render                       | `strategy="afterInteractive"` ensures client-only execution     |
| `notFound()`            | Must be called, not `return null`              | Triggers Next.js 404 page                                       |
| `siteConfig` in JSON-LD | `siteConfig` reads env at module init          | Safe in Server Components — never imported in Client Components |
