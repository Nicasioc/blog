# Phase 4: Application Layer

## Context

Phase 4 implements the use case layer that sits between Next.js route files and the WordPress persistence layer. It orchestrates repository calls, composes view-ready data shapes, and owns all null/not-found handling. Routes only import from `src/application/` — they never call repositories directly.

**Dependency direction:** `routes` → `application` → `persistence/domain` (one way).

---

## New Shared Type — `src/domain/shared/pagination.model.ts`

Define this first; all list use cases depend on it.

```typescript
export type PaginationInfo = {
  currentPage: number
  totalPages: number
  totalItems: number
  perPage: number
}
```

---

## File Structure

```
src/
├── domain/shared/
│   └── pagination.model.ts        ← new
└── application/
    ├── blog/
    │   ├── getPostsList.ts
    │   ├── getPostBySlug.ts
    │   ├── getHomepageData.ts
    │   ├── getHomepageData.test.ts
    │   ├── getCategoryArchive.ts
    │   ├── getTagArchive.ts
    │   └── submitComment.ts       ← new (Server Action)
    └── page/
        └── getPageBySlug.ts
```

---

## Use Cases

### `src/application/blog/getPostsList.ts`

```typescript
import { fetchPostsList } from '@/persistence/wordpress/repositories/postRepository'
import type { Post } from '@/domain/post/post.model'
import type { PaginationInfo } from '@/domain/shared/pagination.model'

export type PostsListData = {
  posts: Post[]
  pagination: PaginationInfo
}

type GetPostsListParams = {
  page?: number
  perPage?: number
  categoryId?: number
  tagId?: number
}

export const getPostsList = async (params: GetPostsListParams = {}): Promise<PostsListData> => {
  const { page = 1, perPage = 10, categoryId, tagId } = params

  const result = await fetchPostsList({ page, perPage, categoryId, tagId })

  return {
    posts: result.posts,
    pagination: {
      currentPage: page,
      totalPages: result.totalPages,
      totalItems: result.totalItems,
      perPage,
    },
  }
}
```

---

### `src/application/blog/getPostBySlug.ts`

```typescript
import {
  fetchPostBySlug,
  fetchRelatedPosts,
} from '@/persistence/wordpress/repositories/postRepository'
import { fetchCommentsByPostId } from '@/persistence/wordpress/repositories/commentRepository'
import type { Post } from '@/domain/post/post.model'
import type { Comment } from '@/domain/comment/comment.model'

export type PostDetailData = {
  post: Post
  relatedPosts: Post[]
  comments: Comment[]
}

export const getPostBySlug = async (slug: string): Promise<PostDetailData | null> => {
  const post = await fetchPostBySlug(slug)
  if (!post) return null

  // relatedPosts and comments both depend only on the post — run in parallel
  const [relatedPosts, comments] = await Promise.all([
    fetchRelatedPosts(
      post.categories.map((c) => c.id),
      post.id,
    ),
    fetchCommentsByPostId(post.id),
  ])

  return { post, relatedPosts, comments }
}
```

**Note:** `fetchPostBySlug` must still run first (we need the post's ID and category IDs). `relatedPosts` and `comments` can then run in parallel since both only require data from the post.

---

### `src/application/blog/getHomepageData.ts`

```typescript
import { fetchPostsList } from '@/persistence/wordpress/repositories/postRepository'
import { fetchAllCategories } from '@/persistence/wordpress/repositories/categoryRepository'
import type { Post } from '@/domain/post/post.model'
import type { Category } from '@/domain/category/category.model'

const HOMEPAGE_POST_COUNT = 7

export type HomepageData = {
  featuredPost: Post | null
  recentPosts: Post[]
  categories: Category[]
}

export const getHomepageData = async (): Promise<HomepageData> => {
  const [postsResult, categories] = await Promise.all([
    fetchPostsList({ perPage: HOMEPAGE_POST_COUNT }),
    fetchAllCategories(),
  ])

  const [featuredPost = null, ...recentPosts] = postsResult.posts

  return { featuredPost, recentPosts, categories }
}
```

Posts and categories are fetched in parallel — `Promise.all` here saves one round-trip on every homepage load.

---

### `src/application/blog/getCategoryArchive.ts`

```typescript
import { fetchCategoryBySlug } from '@/persistence/wordpress/repositories/categoryRepository'
import { fetchPostsList } from '@/persistence/wordpress/repositories/postRepository'
import type { Category } from '@/domain/category/category.model'
import type { Post } from '@/domain/post/post.model'
import type { PaginationInfo } from '@/domain/shared/pagination.model'

export type CategoryArchiveData = {
  category: Category
  posts: Post[]
  pagination: PaginationInfo
}

type GetCategoryArchiveParams = {
  slug: string
  page?: number
  perPage?: number
}

export const getCategoryArchive = async (
  params: GetCategoryArchiveParams,
): Promise<CategoryArchiveData | null> => {
  const { slug, page = 1, perPage = 10 } = params

  const category = await fetchCategoryBySlug(slug)
  if (!category) return null

  const result = await fetchPostsList({ categoryId: category.id, page, perPage })

  return {
    category,
    posts: result.posts,
    pagination: {
      currentPage: page,
      totalPages: result.totalPages,
      totalItems: result.totalItems,
      perPage,
    },
  }
}
```

**Key pattern:** WP REST cannot filter posts by category slug — only by ID. This use case owns the slug → ID resolution. The route just passes the slug.

---

### `src/application/blog/getTagArchive.ts`

```typescript
import { fetchTagBySlug } from '@/persistence/wordpress/repositories/tagRepository'
import { fetchPostsList } from '@/persistence/wordpress/repositories/postRepository'
import type { Tag } from '@/domain/tag/tag.model'
import type { Post } from '@/domain/post/post.model'
import type { PaginationInfo } from '@/domain/shared/pagination.model'

export type TagArchiveData = {
  tag: Tag
  posts: Post[]
  pagination: PaginationInfo
}

type GetTagArchiveParams = {
  slug: string
  page?: number
  perPage?: number
}

export const getTagArchive = async (
  params: GetTagArchiveParams,
): Promise<TagArchiveData | null> => {
  const { slug, page = 1, perPage = 10 } = params

  const tag = await fetchTagBySlug(slug)
  if (!tag) return null

  const result = await fetchPostsList({ tagId: tag.id, page, perPage })

  return {
    tag,
    posts: result.posts,
    pagination: {
      currentPage: page,
      totalPages: result.totalPages,
      totalItems: result.totalItems,
      perPage,
    },
  }
}
```

---

### `src/application/page/getPageBySlug.ts`

```typescript
import { fetchPageBySlug } from '@/persistence/wordpress/repositories/pageRepository'
import type { WpPage } from '@/domain/page/page.model'

export const getPageBySlug = async (slug: string): Promise<WpPage | null> => {
  return fetchPageBySlug(slug)
}
```

Thin pass-through — kept in application layer so routes never import from persistence directly.

---

### `src/application/blog/submitComment.ts`

Server Action — called directly from `CommentForm`. No proxy API route needed; the action POSTs to WP server-side, bypassing CORS.

```typescript
'use server'
import { revalidateTag } from 'next/cache'
import { serverEnv } from '@/lib/env'
import { logger } from '@/utils/logger'
import type { CommentSubmission } from '@/domain/comment/comment.model'

export type SubmitCommentResult = { success: true } | { success: false; error: string }

export const submitComment = async (data: CommentSubmission): Promise<SubmitCommentResult> => {
  const response = await fetch(`${serverEnv.WORDPRESS_API_URL}/wp/v2/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      post: data.postId,
      parent: data.parentId ?? 0,
      author_name: data.authorName,
      author_email: data.authorEmail,
      author_url: data.authorUrl ?? '',
      content: data.content,
    }),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const message = typeof body?.message === 'string' ? body.message : `WP error ${response.status}`
    logger.warn('Comment submission failed', { status: response.status, message })
    return { success: false, error: message }
  }

  revalidateTag(`comments-${data.postId}`)
  return { success: true }
}
```

**Key design decisions:**

- `'use server'` at the top — makes this a Next.js Server Action; `CommentForm` imports and calls it directly
- WP REST API for comments does **not** use `wpFetch` — this is a write operation with no caching
- `revalidateTag(`comments-${data.postId}`)` — busts the comment cache for this post; next request fetches fresh comments from WP
- WP moderates comments from new authors — the UI always shows "awaiting moderation" on success to set expectations
- `author_email` is sent to WP but never stored in the domain layer or returned in responses — privacy preserved

**WordPress configuration required:**

- Settings → Discussion → "Allow people to post comments on new posts" must be enabled
- Comments from new authors are held for moderation unless the author has a previously approved comment

---

## Tests

### `src/application/blog/getHomepageData.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getHomepageData } from './getHomepageData'

vi.mock('@/persistence/wordpress/repositories/postRepository', () => ({
  fetchPostsList: vi.fn(),
}))
vi.mock('@/persistence/wordpress/repositories/categoryRepository', () => ({
  fetchAllCategories: vi.fn(),
}))

import { fetchPostsList } from '@/persistence/wordpress/repositories/postRepository'
import { fetchAllCategories } from '@/persistence/wordpress/repositories/categoryRepository'

const makePost = (id: number) => ({ id, slug: `post-${id}` }) as any

describe('getHomepageData', () => {
  beforeEach(() => vi.clearAllMocks())

  it('splits first post as featuredPost and rest as recentPosts', async () => {
    const posts = [makePost(1), makePost(2), makePost(3)]
    vi.mocked(fetchPostsList).mockResolvedValue({ posts, totalItems: 3, totalPages: 1 })
    vi.mocked(fetchAllCategories).mockResolvedValue([])

    const data = await getHomepageData()
    expect(data.featuredPost?.id).toBe(1)
    expect(data.recentPosts).toHaveLength(2)
    expect(data.recentPosts[0].id).toBe(2)
  })

  it('returns null featuredPost when no posts exist', async () => {
    vi.mocked(fetchPostsList).mockResolvedValue({ posts: [], totalItems: 0, totalPages: 0 })
    vi.mocked(fetchAllCategories).mockResolvedValue([])

    const data = await getHomepageData()
    expect(data.featuredPost).toBeNull()
    expect(data.recentPosts).toEqual([])
  })
})
```

---

## Verification Checklist

1. `npm run typecheck` — zero errors; all use-case return types flow cleanly from domain models
2. `npm run test:run` — `getHomepageData.test.ts` passes
3. `npm run lint` — zero errors
4. Confirm no `import` from `@/persistence/` appears in any route file (routes import only from `@/application/`)

---

## Definition of Done

- All 7 use cases implemented with correct return types (including `submitComment`)
- `PaginationInfo` lives in `src/domain/shared/pagination.model.ts`
- `getPostBySlug` returns `null` — never throws — so routes can call `notFound()`
- `getPostBySlug` fetches `relatedPosts` and `comments` in parallel via `Promise.all`
- `getHomepageData` uses `Promise.all` for parallel fetches
- `getCategoryArchive` and `getTagArchive` own slug-to-ID resolution
- `submitComment` is a Server Action (`'use server'`) that calls WP REST and calls `revalidateTag` on success
- `getHomepageData.test.ts` covers featured/recent split and empty-posts edge case
- No persistence imports in application layer's public interface (return types are domain models only)

---

## Key Gotchas

| Area                   | Issue                                                               | Fix                                                               |
| ---------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `getPostBySlug`        | Cannot parallelize — related posts need category IDs from the post  | Sequential: fetch post first, then related                        |
| Category/Tag slug      | WP only filters by ID                                               | Resolve slug → entity in use case before calling `fetchPostsList` |
| Destructuring default  | `const [first = null, ...rest] = arr` — safe even when arr is empty | Used in `getHomepageData`                                         |
| `getPageBySlug`        | Thin pass-through — still kept in application layer                 | Routes must never import from persistence                         |
| `submitComment`        | Write operation — cannot use `wpFetch` (cache layer)                | Call `fetch` directly; `wpFetch` is read-only                     |
| `submitComment` CORS   | WP REST API doesn't allow cross-origin POST from browser            | `'use server'` ensures it runs server-side only                   |
| Comments not appearing | WP holds new authors for moderation                                 | Always show "awaiting moderation" success UI                      |
