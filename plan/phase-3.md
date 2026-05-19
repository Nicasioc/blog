# Phase 3: WordPress Persistence Layer

## Context

Phase 3 builds the data access layer that bridges the WordPress REST API and the domain models defined in Phase 2. It is responsible for: fetching raw WP data, transforming it into clean domain types, and exposing typed repository functions to the application layer. Nothing above this layer (application, UI) ever touches raw WP API shapes.

**Dependency direction:** `persistence` → `domain` (one way). Persistence imports domain models for output types. Domain never imports from persistence.

**Three sub-layers in order of implementation:**

1. **DTOs** — TypeScript types that mirror the WP REST API response exactly
2. **`wpClient.ts`** — The single fetch wrapper all repositories use
3. **Mappers** — Pure functions: `WpXxxDto → DomainModel`
4. **Repositories** — Thin functions that call `wpClient` and apply mappers

---

## File Structure

```
src/persistence/wordpress/
├── wpClient.ts
├── wpError.ts
├── types/
│   ├── wpPost.dto.ts
│   ├── wpCategory.dto.ts
│   ├── wpTag.dto.ts
│   ├── wpAuthor.dto.ts
│   ├── wpMedia.dto.ts
│   ├── wpPage.dto.ts
│   └── wpComment.dto.ts           ← new
├── mappers/
│   ├── postMapper.ts
│   ├── postMapper.test.ts
│   ├── categoryMapper.ts
│   ├── categoryMapper.test.ts
│   ├── tagMapper.ts
│   ├── authorMapper.ts
│   ├── pageMapper.ts
│   ├── commentMapper.ts           ← new
│   └── commentMapper.test.ts      ← new
└── repositories/
    ├── postRepository.ts
    ├── categoryRepository.ts
    ├── tagRepository.ts
    ├── authorRepository.ts
    ├── pageRepository.ts
    └── commentRepository.ts       ← new
```

---

## Step 1 — `src/persistence/wordpress/wpError.ts`

Define this first — `wpClient.ts` depends on it.

```typescript
export class WpApiError extends Error {
  readonly status: number
  readonly endpoint: string

  constructor(status: number, endpoint: string, message: string) {
    super(message)
    this.name = 'WpApiError'
    this.status = status
    this.endpoint = endpoint
  }
}

export const isNotFoundError = (error: unknown): boolean =>
  error instanceof WpApiError && error.status === 404
```

---

## Step 2 — `src/persistence/wordpress/wpClient.ts`

The single fetch wrapper. All repositories call this — never `fetch` directly.

```typescript
import { serverEnv } from '@/lib/env'
import { logger } from '@/utils/logger'
import { WpApiError } from '@/persistence/wordpress/wpError'

export type WpFetchResult<T> = {
  data: T
  totalItems: number
  totalPages: number
}

type WpFetchOptions = {
  params?: Record<string, string | number | boolean | undefined>
  tags?: string[]
  revalidate?: number
}

export const wpFetch = async <T>(
  endpoint: string,
  options: WpFetchOptions = {},
): Promise<WpFetchResult<T>> => {
  const { params = {}, tags = [], revalidate = serverEnv.REVALIDATE_POSTS } = options

  const url = new URL(`${serverEnv.WORDPRESS_API_URL}${endpoint}`)

  // Always embed related data — collapses author, media, terms into one request
  url.searchParams.set('_embed', '1')

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, String(value))
    }
  })

  const response = await fetch(url.toString(), {
    next: { tags, revalidate },
  })

  if (!response.ok) {
    logger.warn('WP API request failed', { endpoint, status: response.status })
    throw new WpApiError(response.status, endpoint, `WP API error: ${response.status}`)
  }

  const data = (await response.json()) as T
  const totalItems = Number(response.headers.get('X-WP-Total') ?? '0')
  const totalPages = Number(response.headers.get('X-WP-TotalPages') ?? '1')

  return { data, totalItems, totalPages }
}
```

**Key design decisions:**

- `_embed=1` is always added — without it, fetching a post list means N+1 requests for author/image/terms
- Pagination headers `X-WP-Total` and `X-WP-TotalPages` live in response headers, not the body — this is unique to WP REST and easy to miss
- `revalidate` defaults to `serverEnv.REVALIDATE_POSTS` (3600s) — repositories override per resource type
- `tags` array enables on-demand ISR invalidation via `revalidateTag()` in a webhook route handler
- All errors are thrown as `WpApiError` — the application layer catches and maps 404 to `null`, 5xx to user-facing error

---

## Step 3 — DTO Types (`src/persistence/wordpress/types/`)

These mirror the WP REST API response shapes exactly. No transformation here.

### `wpAuthor.dto.ts`

```typescript
export type WpAuthorDto = {
  id: number
  slug: string
  name: string
  description: string
  link: string
  avatar_urls: {
    '24'?: string
    '48'?: string
    '96'?: string
  }
}
```

### `wpMedia.dto.ts`

(Embedded featured image shape inside `_embedded['wp:featuredmedia']`)

```typescript
export type WpMediaDto = {
  id: number
  source_url: string
  alt_text: string
  media_details: {
    width: number
    height: number
    sizes?: {
      large?: { source_url: string; width: number; height: number }
      medium_large?: { source_url: string; width: number; height: number }
      full?: { source_url: string; width: number; height: number }
    }
  }
}
```

### `wpCategory.dto.ts`

```typescript
export type WpCategoryDto = {
  id: number
  slug: string
  name: string
  description: string
  count: number // post count
  link: string
}
```

### `wpTag.dto.ts`

```typescript
export type WpTagDto = {
  id: number
  slug: string
  name: string
  description: string
  count: number
  link: string
}
```

### `wpPost.dto.ts`

The most complex DTO. The `_embedded` field is optional because bare requests (without `?_embed`) won't have it.

```typescript
import type { WpAuthorDto } from './wpAuthor.dto'
import type { WpMediaDto } from './wpMedia.dto'
import type { WpCategoryDto } from './wpCategory.dto'
import type { WpTagDto } from './wpTag.dto'

export type WpYoastHeadDto = {
  title?: string
  description?: string
  og_image?: Array<{ url: string }>
}

export type WpPostDto = {
  id: number
  slug: string
  status: 'publish' | 'draft' | 'private' | 'pending' | 'future'
  date_gmt: string // ISO 8601 UTC — use _gmt variants, not local time
  modified_gmt: string // ISO 8601 UTC
  title: { rendered: string }
  excerpt: { rendered: string }
  content: { rendered: string }
  featured_media: number // 0 when no image
  author: number // user ID
  categories: number[]
  tags: number[]
  link: string // canonical URL from WP — we override with our own
  yoast_head_json?: WpYoastHeadDto
  _embedded?: {
    author?: WpAuthorDto[]
    'wp:featuredmedia'?: WpMediaDto[]
    'wp:term'?: (WpCategoryDto[] | WpTagDto[])[]
  }
}
```

### `wpPage.dto.ts`

```typescript
import type { WpYoastHeadDto } from './wpPost.dto'

export type WpPageDto = {
  id: number
  slug: string
  status: 'publish' | 'draft' | 'private'
  modified_gmt: string
  title: { rendered: string }
  content: { rendered: string }
  link: string
  yoast_head_json?: WpYoastHeadDto
}
```

---

## Step 4 — Mappers (`src/persistence/wordpress/mappers/`)

Mappers are pure functions — they take a DTO and return a domain model. No side effects, no async, no logging.

### `authorMapper.ts`

```typescript
import type { WpAuthorDto } from '@/persistence/wordpress/types/wpAuthor.dto'
import type { Author } from '@/domain/author/author.model'

export const mapWpAuthorToAuthor = (dto: WpAuthorDto): Author => ({
  id: dto.id,
  slug: dto.slug,
  name: dto.name,
  description: dto.description,
  avatarUrl: dto.avatar_urls['96'] ?? dto.avatar_urls['48'] ?? null,
  profileUrl: dto.link,
})
```

`avatar_urls['96']` is the largest Gravatar size WP provides. Falls back to 48px, then `null`.

### `categoryMapper.ts`

```typescript
import type { WpCategoryDto } from '@/persistence/wordpress/types/wpCategory.dto'
import type { Category } from '@/domain/category/category.model'

export const mapWpCategoryToCategory = (dto: WpCategoryDto): Category => ({
  id: dto.id,
  slug: dto.slug,
  name: dto.name,
  description: dto.description,
  postCount: dto.count,
})
```

### `tagMapper.ts`

```typescript
import type { WpTagDto } from '@/persistence/wordpress/types/wpTag.dto'
import type { Tag } from '@/domain/tag/tag.model'

export const mapWpTagToTag = (dto: WpTagDto): Tag => ({
  id: dto.id,
  slug: dto.slug,
  name: dto.name,
  description: dto.description,
  postCount: dto.count,
})
```

### `postMapper.ts`

The most complex mapper. Takes `WpPostDto` + `siteUrl` and returns `Post`.

```typescript
import type { WpPostDto } from '@/persistence/wordpress/types/wpPost.dto'
import type { Post, FeaturedImage, PostSeo } from '@/domain/post/post.model'
import type { Author } from '@/domain/author/author.model'
import type { Category } from '@/domain/category/category.model'
import type { Tag } from '@/domain/tag/tag.model'
import { mapWpAuthorToAuthor } from './authorMapper'
import { mapWpCategoryToCategory } from './categoryMapper'
import { mapWpTagToTag } from './tagMapper'
import { isNonEmptyArray } from '@/utils/checks'

const stripHtml = (html: string): string => html.replace(/<[^>]*>/g, '').trim()

const extractFeaturedImage = (dto: WpPostDto): FeaturedImage | null => {
  const media = dto._embedded?.['wp:featuredmedia']?.[0]
  if (!media || dto.featured_media === 0) return null

  // Prefer 'large' size, fall back to source_url
  const largeSize = media.media_details.sizes?.large
  return {
    url: largeSize?.source_url ?? media.source_url,
    alt: media.alt_text || '',
    width: largeSize?.width ?? media.media_details.width,
    height: largeSize?.height ?? media.media_details.height,
  }
}

const extractAuthor = (dto: WpPostDto): Author => {
  const embedded = dto._embedded?.author?.[0]
  if (embedded) return mapWpAuthorToAuthor(embedded)

  // Fallback for non-embedded requests (should not happen in practice)
  return {
    id: dto.author,
    slug: '',
    name: 'Unknown',
    description: '',
    avatarUrl: null,
    profileUrl: '',
  }
}

const extractCategories = (dto: WpPostDto): Category[] => {
  const terms = dto._embedded?.['wp:term']
  if (!isNonEmptyArray(terms)) return []
  const categoryTerms = terms[0]
  if (!isNonEmptyArray<unknown>(categoryTerms)) return []
  return (categoryTerms as Parameters<typeof mapWpCategoryToCategory>[0][]).map(
    mapWpCategoryToCategory,
  )
}

const extractTags = (dto: WpPostDto): Tag[] => {
  const terms = dto._embedded?.['wp:term']
  if (!isNonEmptyArray(terms) || terms.length < 2) return []
  const tagTerms = terms[1]
  if (!isNonEmptyArray<unknown>(tagTerms)) return []
  return (tagTerms as Parameters<typeof mapWpTagToTag>[0][]).map(mapWpTagToTag)
}

const extractSeo = (dto: WpPostDto): PostSeo | null => {
  const yoast = dto.yoast_head_json
  if (!yoast) return null
  if (!yoast.title && !yoast.description) return null

  return {
    metaTitle: yoast.title ?? '',
    metaDescription: yoast.description ?? '',
    ogImage: yoast.og_image?.[0]?.url ?? null,
  }
}

export const mapWpPostToPost = (dto: WpPostDto, siteUrl: string): Post => ({
  id: dto.id,
  slug: dto.slug,
  title: dto.title.rendered,
  excerpt: stripHtml(dto.excerpt.rendered),
  content: dto.content.rendered,
  publishedAt: new Date(dto.date_gmt + 'Z'), // ensure UTC parsing
  modifiedAt: new Date(dto.modified_gmt + 'Z'),
  featuredImage: extractFeaturedImage(dto),
  author: extractAuthor(dto),
  categories: extractCategories(dto),
  tags: extractTags(dto),
  canonicalUrl: `${siteUrl}/blog/${dto.slug}`,
  seo: extractSeo(dto),
})
```

**Critical details:**

- `date_gmt` not `date` — WP returns both; `_gmt` is UTC, `date` is site-local time. Always use UTC.
- Append `'Z'` to `date_gmt` — WP omits the timezone suffix, so `new Date()` treats it as local time without it.
- `_embedded['wp:term'][0]` = categories, `[1]` = tags — this is WP's fixed ordering.
- `canonicalUrl` built here from `siteUrl` param, not from `dto.link` — WP's own URL may differ from our domain.
- `stripHtml` is a private utility local to this mapper.

---

### `wpComment.dto.ts` (`src/persistence/wordpress/types/wpComment.dto.ts`)

```typescript
export type WpCommentDto = {
  id: number
  post: number
  parent: number // 0 for top-level comments
  author_name: string
  author_url: string
  date_gmt: string // ISO 8601 UTC — append 'Z' when parsing
  content: { rendered: string }
  status: 'approved' | 'hold' | 'spam' | 'trash'
}
```

**Note:** `?_embed` has no effect on the `/wp/v2/comments` endpoint — author and media are not embedded. The fields above are available directly.

---

### `pageMapper.ts`

```typescript
import type { WpPageDto } from '@/persistence/wordpress/types/wpPage.dto'
import type { WpPage } from '@/domain/page/page.model'
import type { PostSeo } from '@/domain/post/post.model'

const extractPageSeo = (dto: WpPageDto): PostSeo | null => {
  const yoast = dto.yoast_head_json
  if (!yoast?.title && !yoast?.description) return null
  return {
    metaTitle: yoast?.title ?? '',
    metaDescription: yoast?.description ?? '',
    ogImage: yoast?.og_image?.[0]?.url ?? null,
  }
}

export const mapWpPageToWpPage = (dto: WpPageDto): WpPage => ({
  id: dto.id,
  slug: dto.slug,
  title: dto.title.rendered,
  content: dto.content.rendered,
  modifiedAt: new Date(dto.modified_gmt + 'Z'),
  seo: extractPageSeo(dto),
})
```

### `commentMapper.ts`

```typescript
import type { WpCommentDto } from '@/persistence/wordpress/types/wpComment.dto'
import type { Comment } from '@/domain/comment/comment.model'

export const mapWpCommentToComment = (dto: WpCommentDto): Comment => ({
  id: dto.id,
  postId: dto.post,
  parentId: dto.parent === 0 ? null : dto.parent,
  authorName: dto.author_name,
  authorUrl: dto.author_url || null,
  publishedAt: new Date(dto.date_gmt + 'Z'),
  content: dto.content.rendered,
  children: [],
})

export const buildCommentTree = (flat: Comment[]): Comment[] => {
  const map = new Map<number, Comment>()
  const roots: Comment[] = []

  for (const c of flat) {
    map.set(c.id, { ...c, children: [] })
  }

  for (const c of map.values()) {
    if (c.parentId === null) {
      roots.push(c)
    } else {
      const parent = map.get(c.parentId)
      if (parent) {
        parent.children.push(c)
      } else {
        roots.push(c) // orphaned reply — treat as top-level
      }
    }
  }

  return roots
}
```

**Key details:**

- `parent === 0` in WP means top-level — normalised to `null` in the domain model
- `author_url || null` — WP returns empty string for commenters with no URL
- `date_gmt + 'Z'` — same UTC parsing pattern as posts
- `buildCommentTree` builds a fresh copy of each node (`{ ...c, children: [] }`) before mutating children — avoids polluting the flat input array
- Orphaned replies (parent ID not found in the set) are promoted to top-level to prevent data loss

---

## Step 5 — Repositories (`src/persistence/wordpress/repositories/`)

Repositories call `wpFetch`, apply mappers, and return domain types. They are the only code that knows about WP-specific API patterns (slugs, pagination params, term resolution).

### `postRepository.ts`

```typescript
import { wpFetch } from '@/persistence/wordpress/wpClient'
import { mapWpPostToPost } from '@/persistence/wordpress/mappers/postMapper'
import type { WpPostDto } from '@/persistence/wordpress/types/wpPost.dto'
import type { Post } from '@/domain/post/post.model'
import { isNotFoundError } from '@/persistence/wordpress/wpError'
import { clientEnv } from '@/lib/env'
import { serverEnv } from '@/lib/env'

type PostsListParams = {
  page?: number
  perPage?: number
  categoryId?: number
  tagId?: number
}

export type PostsListResult = {
  posts: Post[]
  totalItems: number
  totalPages: number
}

export const fetchPostsList = async (params: PostsListParams = {}): Promise<PostsListResult> => {
  const { page = 1, perPage = 10, categoryId, tagId } = params

  const result = await wpFetch<WpPostDto[]>('/wp/v2/posts', {
    params: {
      page,
      per_page: perPage,
      categories: categoryId,
      tags: tagId,
      status: 'publish',
    },
    tags: ['posts'],
    revalidate: serverEnv.REVALIDATE_POSTS,
  })

  return {
    posts: result.data.map((dto) => mapWpPostToPost(dto, clientEnv.NEXT_PUBLIC_SITE_URL)),
    totalItems: result.totalItems,
    totalPages: result.totalPages,
  }
}

export const fetchPostBySlug = async (slug: string): Promise<Post | null> => {
  try {
    const result = await wpFetch<WpPostDto[]>('/wp/v2/posts', {
      params: { slug, status: 'publish' },
      tags: ['posts', `post-${slug}`],
      revalidate: serverEnv.REVALIDATE_POSTS,
    })

    const dto = result.data[0]
    if (!dto) return null

    return mapWpPostToPost(dto, clientEnv.NEXT_PUBLIC_SITE_URL)
  } catch (error) {
    if (isNotFoundError(error)) return null
    throw error
  }
}

export const fetchRelatedPosts = async (
  categoryIds: number[],
  excludeId: number,
): Promise<Post[]> => {
  if (categoryIds.length === 0) return []

  const result = await wpFetch<WpPostDto[]>('/wp/v2/posts', {
    params: {
      categories: categoryIds.join(','),
      exclude: excludeId,
      per_page: 3,
      status: 'publish',
    },
    tags: ['posts'],
    revalidate: serverEnv.REVALIDATE_POSTS,
  })

  return result.data.map((dto) => mapWpPostToPost(dto, clientEnv.NEXT_PUBLIC_SITE_URL))
}

export const fetchAllPostSlugs = async (): Promise<Array<{ slug: string }>> => {
  // WP REST max per_page is 100. Loop pages if needed.
  const firstPage = await wpFetch<WpPostDto[]>('/wp/v2/posts', {
    params: { per_page: 100, page: 1, status: 'publish', _fields: 'slug' },
    tags: ['posts'],
    revalidate: serverEnv.REVALIDATE_PAGES,
  })

  if (firstPage.totalPages <= 1) {
    return firstPage.data.map(({ slug }) => ({ slug }))
  }

  const remainingPages = Array.from({ length: firstPage.totalPages - 1 }, (_, i) => i + 2)
  const rest = await Promise.all(
    remainingPages.map((page) =>
      wpFetch<WpPostDto[]>('/wp/v2/posts', {
        params: { per_page: 100, page, status: 'publish', _fields: 'slug' },
        tags: ['posts'],
        revalidate: serverEnv.REVALIDATE_PAGES,
      }),
    ),
  )

  return [
    ...firstPage.data.map(({ slug }) => ({ slug })),
    ...rest.flatMap((r) => r.data.map(({ slug }) => ({ slug }))),
  ]
}
```

**Notes:**

- `fetchPostBySlug` uses `?slug=` param — WP returns an array; we take `[0]`
- `fetchAllPostSlugs` uses `?_fields=slug` to minimise payload — only slug field returned
- `fetchAllPostSlugs` paginates automatically — WP REST caps `per_page` at 100

### `categoryRepository.ts`

```typescript
import { wpFetch } from '@/persistence/wordpress/wpClient'
import { mapWpCategoryToCategory } from '@/persistence/wordpress/mappers/categoryMapper'
import type { WpCategoryDto } from '@/persistence/wordpress/types/wpCategory.dto'
import type { Category } from '@/domain/category/category.model'
import { isNotFoundError } from '@/persistence/wordpress/wpError'
import { serverEnv } from '@/lib/env'

export const fetchCategoryBySlug = async (slug: string): Promise<Category | null> => {
  try {
    const result = await wpFetch<WpCategoryDto[]>('/wp/v2/categories', {
      params: { slug },
      tags: ['categories'],
      revalidate: serverEnv.REVALIDATE_PAGES,
    })
    const dto = result.data[0]
    return dto ? mapWpCategoryToCategory(dto) : null
  } catch (error) {
    if (isNotFoundError(error)) return null
    throw error
  }
}

export const fetchAllCategories = async (): Promise<Category[]> => {
  const result = await wpFetch<WpCategoryDto[]>('/wp/v2/categories', {
    params: { per_page: 100, hide_empty: true },
    tags: ['categories'],
    revalidate: serverEnv.REVALIDATE_PAGES,
  })
  return result.data.map(mapWpCategoryToCategory)
}
```

**Key gotcha:** WP REST API does **not** support filtering posts by category slug — only by category ID. The pattern is: `fetchCategoryBySlug(slug)` → get ID → `fetchPostsList({ categoryId: id })`. This slug-to-ID resolution happens in the application layer (Phase 4).

### `tagRepository.ts`

```typescript
import { wpFetch } from '@/persistence/wordpress/wpClient'
import { mapWpTagToTag } from '@/persistence/wordpress/mappers/tagMapper'
import type { WpTagDto } from '@/persistence/wordpress/types/wpTag.dto'
import type { Tag } from '@/domain/tag/tag.model'
import { isNotFoundError } from '@/persistence/wordpress/wpError'
import { serverEnv } from '@/lib/env'

export const fetchTagBySlug = async (slug: string): Promise<Tag | null> => {
  try {
    const result = await wpFetch<WpTagDto[]>('/wp/v2/tags', {
      params: { slug },
      tags: ['tags'],
      revalidate: serverEnv.REVALIDATE_PAGES,
    })
    const dto = result.data[0]
    return dto ? mapWpTagToTag(dto) : null
  } catch (error) {
    if (isNotFoundError(error)) return null
    throw error
  }
}
```

### `pageRepository.ts`

```typescript
import { wpFetch } from '@/persistence/wordpress/wpClient'
import { mapWpPageToWpPage } from '@/persistence/wordpress/mappers/pageMapper'
import type { WpPageDto } from '@/persistence/wordpress/types/wpPage.dto'
import type { WpPage } from '@/domain/page/page.model'
import { isNotFoundError } from '@/persistence/wordpress/wpError'
import { serverEnv } from '@/lib/env'

export const fetchPageBySlug = async (slug: string): Promise<WpPage | null> => {
  try {
    const result = await wpFetch<WpPageDto[]>('/wp/v2/pages', {
      params: { slug, status: 'publish' },
      tags: ['pages', `page-${slug}`],
      revalidate: serverEnv.REVALIDATE_PAGES,
    })
    const dto = result.data[0]
    return dto ? mapWpPageToWpPage(dto) : null
  } catch (error) {
    if (isNotFoundError(error)) return null
    throw error
  }
}

export const fetchAllPageSlugs = async (): Promise<Array<{ slug: string }>> => {
  const result = await wpFetch<WpPageDto[]>('/wp/v2/pages', {
    params: { per_page: 100, status: 'publish', _fields: 'slug' },
    tags: ['pages'],
    revalidate: serverEnv.REVALIDATE_PAGES,
  })
  return result.data.map(({ slug }) => ({ slug }))
}
```

### `authorRepository.ts`

```typescript
import { wpFetch } from '@/persistence/wordpress/wpClient'
import { mapWpAuthorToAuthor } from '@/persistence/wordpress/mappers/authorMapper'
import type { WpAuthorDto } from '@/persistence/wordpress/types/wpAuthor.dto'
import type { Author } from '@/domain/author/author.model'
import { isNotFoundError } from '@/persistence/wordpress/wpError'

export const fetchAuthorById = async (id: number): Promise<Author | null> => {
  try {
    const result = await wpFetch<WpAuthorDto>(`/wp/v2/users/${id}`, {
      tags: ['authors'],
    })
    return mapWpAuthorToAuthor(result.data)
  } catch (error) {
    if (isNotFoundError(error)) return null
    throw error
  }
}
```

### `commentRepository.ts`

```typescript
import { wpFetch } from '@/persistence/wordpress/wpClient'
import {
  mapWpCommentToComment,
  buildCommentTree,
} from '@/persistence/wordpress/mappers/commentMapper'
import type { WpCommentDto } from '@/persistence/wordpress/types/wpComment.dto'
import type { Comment } from '@/domain/comment/comment.model'

export const fetchCommentsByPostId = async (postId: number): Promise<Comment[]> => {
  const result = await wpFetch<WpCommentDto[]>('/wp/v2/comments', {
    params: { post: postId, per_page: 100, status: 'approve' },
    tags: [`comments-${postId}`],
    revalidate: 300, // 5 min — more dynamic than posts
  })
  const flat = result.data.map(mapWpCommentToComment)
  return buildCommentTree(flat)
}
```

**Notes:**

- `status: 'approve'` — WP returns only approved comments to unauthenticated requests by default, but being explicit is safer
- `revalidate: 300` — shorter than posts (3600s) because comments are more dynamic
- `per_page: 100` — fetches up to 100 comments in one request; paginate if a post ever exceeds that
- Tag `comments-${postId}` scopes cache busting to the specific post — `submitComment` calls `revalidateTag` with this tag on success

---

## Step 6 — Tests

Mappers are the highest-value test targets in Phase 3 — they contain branching logic (missing embedded data, empty images, Yoast fields).

### `postMapper.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { mapWpPostToPost } from '@/persistence/wordpress/mappers/postMapper'
import type { WpPostDto } from '@/persistence/wordpress/types/wpPost.dto'

const SITE_URL = 'https://testfc.com'

const baseDto: WpPostDto = {
  id: 1,
  slug: 'test-post',
  status: 'publish',
  date_gmt: '2024-01-01T10:00:00',
  modified_gmt: '2024-01-02T10:00:00',
  title: { rendered: 'Test Post' },
  excerpt: { rendered: '<p>This is the excerpt.</p>' },
  content: { rendered: '<p>Content here</p>' },
  featured_media: 0,
  author: 1,
  categories: [2],
  tags: [3],
  link: 'https://wp.example.com/test-post',
  _embedded: {
    author: [
      {
        id: 1,
        slug: 'author',
        name: 'John Doe',
        description: 'Bio',
        link: 'https://wp.example.com/author/john',
        avatar_urls: { '96': 'https://gravatar.com/96.jpg' },
      },
    ],
    'wp:term': [
      [{ id: 2, slug: 'football', name: 'Football', description: '', count: 10, link: '' }],
      [{ id: 3, slug: 'champions', name: 'Champions', description: '', count: 5, link: '' }],
    ],
  },
}

describe('mapWpPostToPost', () => {
  it('strips HTML from excerpt', () => {
    const post = mapWpPostToPost(baseDto, SITE_URL)
    expect(post.excerpt).toBe('This is the excerpt.')
  })

  it('builds canonical URL from siteUrl + slug', () => {
    const post = mapWpPostToPost(baseDto, SITE_URL)
    expect(post.canonicalUrl).toBe('https://testfc.com/blog/test-post')
  })

  it('parses date_gmt as UTC Date', () => {
    const post = mapWpPostToPost(baseDto, SITE_URL)
    expect(post.publishedAt.toISOString()).toBe('2024-01-01T10:00:00.000Z')
  })

  it('maps embedded author correctly', () => {
    const post = mapWpPostToPost(baseDto, SITE_URL)
    expect(post.author.name).toBe('John Doe')
    expect(post.author.avatarUrl).toBe('https://gravatar.com/96.jpg')
  })

  it('maps embedded categories from wp:term[0]', () => {
    const post = mapWpPostToPost(baseDto, SITE_URL)
    expect(post.categories).toHaveLength(1)
    expect(post.categories[0].slug).toBe('football')
  })

  it('maps embedded tags from wp:term[1]', () => {
    const post = mapWpPostToPost(baseDto, SITE_URL)
    expect(post.tags).toHaveLength(1)
    expect(post.tags[0].slug).toBe('champions')
  })

  it('returns null featuredImage when featured_media is 0', () => {
    const post = mapWpPostToPost(baseDto, SITE_URL)
    expect(post.featuredImage).toBeNull()
  })

  it('maps featuredImage from embedded media', () => {
    const dto: WpPostDto = {
      ...baseDto,
      featured_media: 10,
      _embedded: {
        ...baseDto._embedded,
        'wp:featuredmedia': [
          {
            id: 10,
            source_url: 'https://example.com/full.jpg',
            alt_text: 'A photo',
            media_details: {
              width: 1920,
              height: 1080,
              sizes: {
                large: { source_url: 'https://example.com/large.jpg', width: 1024, height: 576 },
              },
            },
          },
        ],
      },
    }
    const post = mapWpPostToPost(dto, SITE_URL)
    expect(post.featuredImage?.url).toBe('https://example.com/large.jpg')
    expect(post.featuredImage?.width).toBe(1024)
  })

  it('returns null seo when yoast_head_json is absent', () => {
    const post = mapWpPostToPost(baseDto, SITE_URL)
    expect(post.seo).toBeNull()
  })

  it('maps Yoast SEO fields when present', () => {
    const dto: WpPostDto = {
      ...baseDto,
      yoast_head_json: {
        title: 'Yoast Title',
        description: 'Yoast Desc',
        og_image: [{ url: 'https://example.com/og.jpg' }],
      },
    }
    const post = mapWpPostToPost(dto, SITE_URL)
    expect(post.seo?.metaTitle).toBe('Yoast Title')
    expect(post.seo?.ogImage).toBe('https://example.com/og.jpg')
  })

  it('returns empty categories and tags when _embedded is absent', () => {
    const dto: WpPostDto = { ...baseDto, _embedded: undefined }
    const post = mapWpPostToPost(dto, SITE_URL)
    expect(post.categories).toEqual([])
    expect(post.tags).toEqual([])
  })
})
```

### `categoryMapper.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { mapWpCategoryToCategory } from '@/persistence/wordpress/mappers/categoryMapper'

describe('mapWpCategoryToCategory', () => {
  it('maps all fields correctly', () => {
    const category = mapWpCategoryToCategory({
      id: 5,
      slug: 'la-liga',
      name: 'La Liga',
      description: 'Spanish football',
      count: 42,
      link: 'https://wp.com/category/la-liga',
    })
    expect(category.id).toBe(5)
    expect(category.slug).toBe('la-liga')
    expect(category.postCount).toBe(42)
  })
})
```

### `commentMapper.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import {
  mapWpCommentToComment,
  buildCommentTree,
} from '@/persistence/wordpress/mappers/commentMapper'
import type { WpCommentDto } from '@/persistence/wordpress/types/wpComment.dto'

const baseDto: WpCommentDto = {
  id: 1,
  post: 10,
  parent: 0,
  author_name: 'Alice',
  author_url: '',
  date_gmt: '2024-01-01T10:00:00',
  content: { rendered: '<p>Hello</p>' },
  status: 'approved',
}

describe('mapWpCommentToComment', () => {
  it('maps top-level comment (parent=0 → null)', () => {
    const c = mapWpCommentToComment(baseDto)
    expect(c.parentId).toBeNull()
  })
  it('maps reply (parent=5 → 5)', () => {
    const c = mapWpCommentToComment({ ...baseDto, parent: 5 })
    expect(c.parentId).toBe(5)
  })
  it('normalises empty author_url to null', () => {
    const c = mapWpCommentToComment(baseDto)
    expect(c.authorUrl).toBeNull()
  })
  it('parses date_gmt as UTC', () => {
    const c = mapWpCommentToComment(baseDto)
    expect(c.publishedAt.toISOString()).toBe('2024-01-01T10:00:00.000Z')
  })
})

describe('buildCommentTree', () => {
  it('nests replies under their parent', () => {
    const flat = [
      {
        id: 1,
        postId: 10,
        parentId: null,
        authorName: 'A',
        authorUrl: null,
        publishedAt: new Date(),
        content: '',
        children: [],
      },
      {
        id: 2,
        postId: 10,
        parentId: 1,
        authorName: 'B',
        authorUrl: null,
        publishedAt: new Date(),
        content: '',
        children: [],
      },
    ]
    const tree = buildCommentTree(flat)
    expect(tree).toHaveLength(1)
    expect(tree[0].children).toHaveLength(1)
    expect(tree[0].children[0].id).toBe(2)
  })
  it('treats orphaned replies as top-level', () => {
    const flat = [
      {
        id: 3,
        postId: 10,
        parentId: 99,
        authorName: 'C',
        authorUrl: null,
        publishedAt: new Date(),
        content: '',
        children: [],
      },
    ]
    const tree = buildCommentTree(flat)
    expect(tree).toHaveLength(1)
  })
})
```

---

## File Tree After Phase 3

```
src/persistence/wordpress/
├── wpClient.ts
├── wpError.ts
├── types/
│   ├── wpPost.dto.ts
│   ├── wpCategory.dto.ts
│   ├── wpTag.dto.ts
│   ├── wpAuthor.dto.ts
│   ├── wpMedia.dto.ts
│   ├── wpPage.dto.ts
│   └── wpComment.dto.ts
├── mappers/
│   ├── postMapper.ts
│   ├── postMapper.test.ts       ← 11+ assertions
│   ├── categoryMapper.ts
│   ├── categoryMapper.test.ts   ← basic smoke test
│   ├── tagMapper.ts
│   ├── authorMapper.ts
│   ├── pageMapper.ts
│   ├── commentMapper.ts
│   └── commentMapper.test.ts    ← 4 mapper + 2 tree tests
└── repositories/
    ├── postRepository.ts
    ├── categoryRepository.ts
    ├── tagRepository.ts
    ├── authorRepository.ts
    ├── pageRepository.ts
    └── commentRepository.ts
```

---

## Verification Checklist

1. `npm run typecheck` — zero errors; confirm DTO types align with domain model types through mappers
2. `npm run test:run` — all mapper tests pass (postMapper + categoryMapper)
3. `npm run lint` — zero errors
4. **Manual smoke test:** add a temporary script or test that calls `fetchPostsList()` against your real WP instance and logs the first post's title and canonicalUrl — confirms the full chain works end-to-end
5. Confirm `_embedded` is present in the response (check network tab or log `result.data[0]._embedded`) — if absent, `?_embed` is not being sent

---

## Definition of Done

- All DTO types match the actual WP REST API response (verified against your WP instance)
- `wpClient.ts` correctly extracts `X-WP-Total` and `X-WP-TotalPages`
- `postMapper.test.ts` passes all 11+ assertions including edge cases (no image, no Yoast, no \_embedded)
- `commentMapper.test.ts` passes all 6 assertions (4 mapper + 2 tree tests)
- No `fetch` calls outside `wpClient.ts`
- No domain model types imported into DTO files
- No WP-specific types leak above the repository layer

---

## Key Gotchas

| Area                       | Issue                                                     | Fix                                                             |
| -------------------------- | --------------------------------------------------------- | --------------------------------------------------------------- | --- | ----- |
| `date` vs `date_gmt`       | `date` is site-local time — wrong across timezones        | Always use `date_gmt` + append `'Z'` for UTC                    |
| `_embed` not working       | Missing `_embedded` in response                           | Verify `?_embed=1` is in the URL; some WP hosts block it        |
| `X-WP-Total` header        | Missing in CORS preflight                                 | Not an issue server-side; never fetch WP from client            |
| Taxonomy filter by slug    | WP REST only filters posts by term ID, not slug           | Resolve slug → ID in the application layer, not here            |
| `per_page` max             | WP hard-caps at 100                                       | Paginate in `fetchAllPostSlugs` if site has >100 posts          |
| `wp:term` ordering         | `[0]` = categories, `[1]` = tags — not guaranteed in docs | Verified WP behaviour; covered by mapper tests                  |
| Author fallback            | `_embedded.author` can be absent on non-embed requests    | Mapper handles gracefully with a fallback `Unknown` author      |
| `featured_media: 0`        | WP returns 0 (not null) when no image set                 | Explicit `featured_media === 0` check in `extractFeaturedImage` |
| WP returning HTML entities | `title.rendered` may contain `&amp;` etc.                 | Use as-is; Next.js renders HTML entities correctly in JSX       |
| Avatar empty string        | WP returns `''` not `null` for missing avatars            | Mapper normalises to `null` — `avatar_urls['96'] ?? null`       |
| Comment `parent: 0`        | WP uses 0 for top-level, not null                         | Mapper converts `parent === 0` → `parentId: null`               |
| `author_url` empty string  | WP returns `''` when commenter has no URL                 | Mapper normalises to `null` with `                              |     | null` |
| `?_embed` on comments      | Has no effect on `/wp/v2/comments` endpoint               | No embedded data — all needed fields are directly on the DTO    |
| Comments per_page          | WP default is 10 — must override                          | Always pass `per_page: 100` in `fetchCommentsByPostId`          |
