# Phase 2: Domain Models & Utilities

## Context

Phase 2 defines the pure TypeScript heart of the application: domain models, SEO types, metadata utilities, and shared utility functions. These files have **no framework dependencies** (except `metadata.utils.ts` which intentionally imports the `Metadata` type from Next.js). Every layer above — persistence, application, UI — imports from here. Getting these shapes right is critical because changing them later cascades through all mappers, use cases, and components.

**No tests exist yet.** Phase 2 creates the first tests in the project — for type checks and metadata utilities.

---

## File Structure for Phase 2

```
src/
├── domain/
│   ├── author/
│   │   └── author.model.ts
│   ├── category/
│   │   └── category.model.ts
│   ├── tag/
│   │   └── tag.model.ts
│   ├── post/
│   │   └── post.model.ts          ← depends on Author, Category, Tag
│   ├── page/
│   │   └── page.model.ts
│   ├── comment/
│   │   └── comment.model.ts       ← new
│   └── seo/
│       ├── jsonLd.model.ts        ← pure types, no Next.js dep
│       └── metadata.utils.ts      ← imports Metadata from 'next' (intentional)
└── utils/
    ├── checks.ts
    └── logger.ts
```

**Build order matters** — implement leaf models first, then compose:
`Author` → `Category` → `Tag` → `Post` → `Page` → `Comment` → SEO → Utils

---

## Step 1 — `src/domain/author/author.model.ts`

```typescript
export type Author = {
  id: number
  slug: string
  name: string
  description: string
  avatarUrl: string | null
  profileUrl: string
}
```

`avatarUrl` is nullable — WP users without a Gravatar return an empty string from the API; the mapper normalises it to `null`.

---

## Step 2 — `src/domain/category/category.model.ts`

```typescript
export type Category = {
  id: number
  slug: string
  name: string
  description: string
  postCount: number
}
```

`postCount` comes from the WP REST `count` field. Used in sidebar and category archive pages.

---

## Step 3 — `src/domain/tag/tag.model.ts`

```typescript
export type Tag = {
  id: number
  slug: string
  name: string
  description: string
  postCount: number
}
```

Structurally identical to `Category` — kept separate because they serve different routes (`/category/` vs `/tag/`) and may diverge in future.

---

## Step 4 — `src/domain/post/post.model.ts`

The most important domain model. Imports `Author`, `Category`, `Tag`.

```typescript
import type { Author } from '@/domain/author/author.model'
import type { Category } from '@/domain/category/category.model'
import type { Tag } from '@/domain/tag/tag.model'

export type FeaturedImage = {
  url: string
  alt: string
  width: number
  height: number
}

export type PostSeo = {
  metaTitle: string
  metaDescription: string
  ogImage: string | null
}

export type Post = {
  id: number
  slug: string
  title: string
  excerpt: string // plain text — HTML stripped in mapper
  content: string // raw HTML from WP — rendered with dangerouslySetInnerHTML
  publishedAt: Date
  modifiedAt: Date
  featuredImage: FeaturedImage | null
  author: Author
  categories: Category[]
  tags: Tag[]
  canonicalUrl: string
  seo: PostSeo | null // populated from Yoast yoast_head_json if present
}
```

**Design decisions:**

- `excerpt` is plain text (not HTML). The WP REST API returns it wrapped in `<p>` tags — the mapper strips those.
- `content` is raw HTML. It is **never** processed in the domain layer — that is the UI's responsibility (`PostBody` component).
- `seo` is nullable. When Yoast plugin is not active on the WP instance, this will be `null` and `metadata.utils.ts` falls back to `title` and `excerpt`.
- `canonicalUrl` is always set — derived from `siteConfig.siteUrl + '/blog/' + slug` in the mapper.
- `categories` and `tags` are embedded arrays, not IDs. The `?_embed` WP API flag populates them in a single request.

---

## Step 4b — `src/domain/comment/comment.model.ts`

Two types: one for reading comments from WP, one for submitting new ones.

```typescript
export type Comment = {
  id: number
  postId: number
  parentId: number | null
  authorName: string
  authorUrl: string | null
  publishedAt: Date
  content: string // HTML from WP — rendered via ContentHtml
  children: Comment[] // populated by buildCommentTree, not from WP directly
}

export type CommentSubmission = {
  postId: number
  parentId?: number
  authorName: string
  authorEmail: string // required by WP REST, never displayed publicly
  authorUrl?: string
  content: string // plain text — WP wraps in <p> on save
}
```

**Key decisions:**

- `children` is on the domain model (not the DTO) — it's populated client-side by `buildCommentTree` in Phase 3
- `authorEmail` is in `CommentSubmission` only — never stored on `Comment` (not returned by WP to unauthenticated requests)
- `parentId: null` means top-level; `parentId: number` means a reply — WP uses `parent: 0` for top-level, mapper normalises to `null`

---

## Step 5 — `src/domain/page/page.model.ts`

WP static pages (About, Contact, etc.). Named `WpPage` to avoid conflict with Next.js's `Page` type.

```typescript
import type { PostSeo } from '@/domain/post/post.model'

export type WpPage = {
  id: number
  slug: string
  title: string
  content: string // raw HTML from WP
  modifiedAt: Date
  seo: PostSeo | null
}
```

Reuses `PostSeo` from `post.model.ts` — the shape is identical for pages.

---

## Step 6 — `src/domain/seo/jsonLd.model.ts`

Pure TypeScript types for JSON-LD structured data. No Next.js dependency.

```typescript
export type PersonJsonLd = {
  '@type': 'Person'
  name: string
  url?: string
}

export type OrganizationJsonLd = {
  '@type': 'Organization'
  name: string
  logo?: {
    '@type': 'ImageObject'
    url: string
  }
}

export type ArticleJsonLd = {
  '@context': 'https://schema.org'
  '@type': 'Article' | 'BlogPosting'
  headline: string
  datePublished: string // ISO 8601
  dateModified: string // ISO 8601
  author: PersonJsonLd
  publisher: OrganizationJsonLd
  image?: string
  description?: string
  url: string
}

export type BreadcrumbItem = {
  '@type': 'ListItem'
  position: number
  name: string
  item: string // full URL
}

export type BreadcrumbJsonLd = {
  '@context': 'https://schema.org'
  '@type': 'BreadcrumbList'
  itemListElement: BreadcrumbItem[]
}

export type WebSiteJsonLd = {
  '@context': 'https://schema.org'
  '@type': 'WebSite'
  name: string
  url: string
  description?: string
}
```

**Rules enforced by types:**

- `datePublished` / `dateModified` are strings (ISO 8601) — not `Date` objects. JSON-LD must be serialisable.
- `headline` maps to `post.title` — must be plain text, never HTML.
- `description` maps to `post.excerpt` — already stripped of HTML in the domain model.

---

## Step 7 — `src/domain/seo/metadata.utils.ts`

Builds Next.js `Metadata` objects from domain models. The **only** file in `src/domain/` that imports from Next.js — an intentional, documented exception because `Metadata` is purely a type with no runtime impact.

```typescript
import type { Metadata } from 'next'
import type { Post } from '@/domain/post/post.model'
import type { WpPage } from '@/domain/page/page.model'
import type { Category } from '@/domain/category/category.model'
import type { Tag } from '@/domain/tag/tag.model'
import type { SiteConfig } from '@/lib/siteConfig'

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
  const description = category.description || `Latest ${category.name} news and updates.`

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
  const description = tag.description || `Latest articles tagged ${tag.name}.`

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

export const generatePageMetadata = (page: WpPage, siteConfig: SiteConfig): Metadata => {
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
```

**Fallback chain for posts:**

1. Yoast `metaTitle` / `metaDescription` (if Yoast active on WP)
2. Post `title` / `excerpt` (always present)

---

## Step 8 — `src/utils/checks.ts`

```typescript
export const isNil = (value: unknown): value is null | undefined =>
  value === null || value === undefined

export const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

export const isNonEmptyArray = <T>(value: unknown): value is T[] =>
  Array.isArray(value) && value.length > 0

export const isNonEmptyObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  Object.keys(value).length > 0
```

Used throughout persistence mappers for defensive checks on WP API responses.

---

## Step 9 — `src/utils/logger.ts`

Central logger. Enforces the CLAUDE.md rule of no `console.log` in app code.

```typescript
type LogLevel = 'error' | 'warn' | 'info' | 'debug'

type LogContext = Record<string, unknown>

const log = (level: LogLevel, message: string, context?: LogContext): void => {
  if (process.env.NODE_ENV === 'test') return

  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  }

  // eslint-disable-next-line no-console
  console[level === 'debug' ? 'log' : level](JSON.stringify(entry))
}

export const logger = {
  error: (message: string, context?: LogContext) => log('error', message, context),
  warn: (message: string, context?: LogContext) => log('warn', message, context),
  info: (message: string, context?: LogContext) => log('info', message, context),
  debug: (message: string, context?: LogContext) => log('debug', message, context),
}
```

**Key decisions:**

- Silenced in `test` environment — tests should not produce log noise.
- Structured JSON output — ready to swap for Datadog/Logtail by replacing the `console` call.
- `eslint-disable-next-line no-console` — the **one allowed** console usage in the codebase.

---

## Step 10 — Tests

### `src/utils/checks.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { isNil, isNonEmptyString, isNonEmptyArray, isNonEmptyObject } from '@/utils/checks'

describe('isNil', () => {
  it('returns true for null', () => expect(isNil(null)).toBe(true))
  it('returns true for undefined', () => expect(isNil(undefined)).toBe(true))
  it('returns false for empty string', () => expect(isNil('')).toBe(false))
  it('returns false for 0', () => expect(isNil(0)).toBe(false))
  it('returns false for false', () => expect(isNil(false)).toBe(false))
})

describe('isNonEmptyString', () => {
  it('returns true for non-empty string', () => expect(isNonEmptyString('hello')).toBe(true))
  it('returns false for empty string', () => expect(isNonEmptyString('')).toBe(false))
  it('returns false for whitespace-only string', () => expect(isNonEmptyString('  ')).toBe(false))
  it('returns false for number', () => expect(isNonEmptyString(42)).toBe(false))
  it('returns false for null', () => expect(isNonEmptyString(null)).toBe(false))
})

describe('isNonEmptyArray', () => {
  it('returns true for non-empty array', () => expect(isNonEmptyArray([1, 2])).toBe(true))
  it('returns false for empty array', () => expect(isNonEmptyArray([])).toBe(false))
  it('returns false for null', () => expect(isNonEmptyArray(null)).toBe(false))
  it('returns false for object', () => expect(isNonEmptyArray({})).toBe(false))
})

describe('isNonEmptyObject', () => {
  it('returns true for object with keys', () => expect(isNonEmptyObject({ a: 1 })).toBe(true))
  it('returns false for empty object', () => expect(isNonEmptyObject({})).toBe(false))
  it('returns false for array', () => expect(isNonEmptyObject([1, 2])).toBe(false))
  it('returns false for null', () => expect(isNonEmptyObject(null)).toBe(false))
})
```

### `src/domain/seo/metadata.utils.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { generatePostMetadata } from '@/domain/seo/metadata.utils'
import type { Post } from '@/domain/post/post.model'
import type { SiteConfig } from '@/lib/siteConfig'

const mockSiteConfig: SiteConfig = {
  siteName: 'Test FC News',
  siteUrl: 'https://testfc.com',
  logoUrl: '/logo.svg',
  theme: { primary: '#ffffff', secondary: '#000000', primaryForeground: '#000000' },
  adProvider: 'adsense',
  adSensePublisherId: undefined,
}

const mockPost: Post = {
  id: 1,
  slug: 'test-post',
  title: 'Test Post Title',
  excerpt: 'This is the excerpt.',
  content: '<p>Content</p>',
  publishedAt: new Date('2024-01-01'),
  modifiedAt: new Date('2024-01-02'),
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
})
```

---

## File Tree After Phase 2

```
src/
├── domain/
│   ├── author/
│   │   └── author.model.ts
│   ├── category/
│   │   └── category.model.ts
│   ├── tag/
│   │   └── tag.model.ts
│   ├── post/
│   │   └── post.model.ts
│   ├── page/
│   │   └── page.model.ts
│   ├── comment/
│   │   └── comment.model.ts
│   └── seo/
│       ├── jsonLd.model.ts
│       ├── metadata.utils.ts
│       └── metadata.utils.test.ts
└── utils/
    ├── checks.ts
    ├── checks.test.ts
    └── logger.ts
```

---

## Verification Checklist

1. `npm run typecheck` — zero type errors across all new files
2. `npm run test:run` — all tests pass (checks + metadata utils)
3. `npm run lint` — zero errors
4. Imports resolve correctly: `post.model.ts` imports `Author`, `Category`, `Tag` via `@/` alias
5. `metadata.utils.ts` compiles without errors (imports `Metadata` from `next`)

---

## Definition of Done

- All 8 model files created with correct types (including `comment.model.ts`)
- `checks.ts` and `logger.ts` created in `src/utils/`
- `checks.test.ts` — 20+ assertions, all pass
- `metadata.utils.test.ts` — 5+ assertions covering the Yoast/fallback chain, all pass
- Zero `process.env` reads in any domain/utils file
- No `console.log` anywhere — only `logger.*` calls

---

## Key Gotchas

| Area                           | Issue                                              | Fix                                                     |
| ------------------------------ | -------------------------------------------------- | ------------------------------------------------------- |
| `WpPage` naming                | Conflicts with Next.js `Page` type if named `Page` | Use `WpPage` as the type name                           |
| `PostSeo` reuse                | `WpPage` needs same SEO shape as `Post`            | Import `PostSeo` from `post.model.ts`                   |
| `metadata.utils.ts` in domain/ | Imports from `next` — intentional exception        | `Metadata` is type-only, zero runtime impact            |
| JSON-LD dates                  | Must be ISO strings, not `Date` objects            | Call `.toISOString()` at render time, not in the model  |
| `excerpt` HTML                 | WP REST returns `<p>excerpt text</p>`              | Mapper strips HTML — domain type is always plain text   |
| Logger in tests                | Noisy test output                                  | `if (process.env.NODE_ENV === 'test') return` in logger |
| `isNil(0)` / `isNil(false)`    | Must return `false`, not `true`                    | Tests cover these edge cases explicitly                 |
