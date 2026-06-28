# WordPress Integration

## How Data Flows

```
WordPress REST API
      │  ?_embed=1
      ▼
src/persistence/wordpress/wpClient.ts   (fetch wrapper)
      │  WpPostDto, WpCategoryDto, etc.
      ▼
src/persistence/wordpress/mappers/      (DTOs → domain models)
      │  Post, Category, Tag, Author, WpPage, Comment
      ▼
src/persistence/wordpress/repositories/ (typed query functions)
      │  fetchPostsList(), fetchPostBySlug(), etc.
      ▼
src/application/blog/                   (use cases)
      │  getPostBySlug(), getHomepageData(), etc.
      ▼
src/app/ routes                         (render)
```

---

## The `?_embed=1` Strategy

Every request to the WP REST API includes `?_embed=1` (set unconditionally in `wpClient.ts`). This collapses author, featured image, and taxonomy terms into a single response via the `_embedded` property — avoiding 4+ sequential requests per post.

Key `_embedded` fields:

```typescript
dto._embedded?.author?.[0] // WpAuthorDto
dto._embedded?.['wp:featuredmedia']?.[0] // WpMediaDto
dto._embedded?.['wp:term']?.[0] // WpCategoryDto[] (categories)
dto._embedded?.['wp:term']?.[1] // WpTagDto[] (tags)
```

**Note:** `?_embed` has **no effect** on `/wp/v2/comments` — the comment endpoint doesn't support embedding. All comment fields are available directly on the DTO.

---

## Pagination Headers

WP REST API returns pagination data in **response headers**, not the body:

```
X-WP-Total: 147
X-WP-TotalPages: 15
```

`wpClient.ts` extracts these and includes them in `WpFetchResult<T>`:

```typescript
type WpFetchResult<T> = {
  data: T
  totalItems: number // from X-WP-Total header
  totalPages: number // from X-WP-TotalPages header
}
```

---

## UTC Dates — Always Use `date_gmt`

WordPress returns **two** date fields per post:

- `date` — site's local timezone (varies per WP configuration)
- `date_gmt` — UTC (always correct regardless of WP timezone setting)

Always use `date_gmt`. WP omits the `Z` timezone suffix, so `new Date('2024-01-01T10:00:00')` is parsed as **local time** by JavaScript. The mappers always append `'Z'`:

```typescript
publishedAt: new Date(dto.date_gmt + 'Z') // correct: UTC
publishedAt: new Date(dto.date) // wrong: site-local time
```

---

## Slug → ID Resolution

WP REST API **cannot filter posts by category or tag slug** — only by ID. The pattern:

```
fetchCategoryBySlug('premier-league')     → Category { id: 5, ... }
fetchPostsList({ categoryId: 5 })         → Post[]
```

This resolution happens in the **application layer** (`getCategoryArchive.ts`, `getTagArchive.ts`), not in the repository. Repositories only know about IDs.

---

## Multi-Tenant Post Scoping

When multiple white-label sites share a single WordPress instance, each tenant needs to
declare which posts belong to it. The convention is to assign every post to a **tenant
category** or a **tenant tag** inside WordPress. The corresponding env var then tells the
app to filter all fetches accordingly.

### WordPress-side setup

**Tag strategy (recommended):** Create one tag per tenant (e.g. `site-a`, `site-b`). Every
post authored for a given tenant gets that tag. Content categories (`Sports`, `Politics`,
etc.) remain independent.

**Category strategy:** Create one top-level category per tenant. Posts belong to both the
tenant category and a content category. This is simpler to set up but has a filtering
limitation (see below).

### How the filter is applied

`WORDPRESS_CATEGORY_ID` / `WORDPRESS_TAG_ID` are read from `serverEnv` and used as
parameter defaults inside `fetchPostsList`:

```
serverEnv.WORDPRESS_CATEGORY_ID / WORDPRESS_TAG_ID
  → postRepository.fetchPostsList (default params)
  → wpFetch '/wp/v2/posts' { categories: ..., tags: ... }
  → WP REST API filters server-side
```

`fetchAllPostSlugs` (used for static generation) also receives the scope so that only
in-scope post pages are pre-rendered.

Caller-provided params override the env defaults. `getCategoryArchive` passes the archive's
own `categoryId`, replacing the global scope for that request.

### AND vs OR — why tags are preferred

WordPress REST API combines **different** taxonomy params as AND:

```
GET /wp/v2/posts?tags=7&categories=10
→ posts tagged 7 AND in category 10   ✅
```

But multiple values of the **same** param are OR:

```
GET /wp/v2/posts?categories=5,10
→ posts in category 5 OR category 10  ⚠️
```

With tag-based scoping, browsing the category archive sends `?tags=SCOPE&categories=ARCHIVE`
— AND logic, correct isolation. With category-based scoping, the archive category param
replaces (not ANDs with) the scope, so posts outside the tenant scope may appear in
category archive pages.

---

## Post Slug Lookup

Fetching a post by slug uses a query parameter (not a path segment):

```
GET /wp/v2/posts?slug=my-post-slug&_embed=1
```

WP returns an **array** (always check `result.data[0]`). If the array is empty, the post doesn't exist — the repository returns `null`.

---

## ISR Webhook

When a post is published or updated in WordPress, Next.js needs to purge its cache. The webhook flow:

```
WordPress save_post hook
    │  POST https://yoursite.com/api/revalidate?secret=REVALIDATE_SECRET
    │  Body: { "slug": "the-post-slug" }
    ▼
src/app/api/revalidate/route.ts
    │  validates secret
    │  revalidateTag('post-the-post-slug', { expire: REVALIDATE_POSTS })
    │  revalidateTag('posts', { expire: REVALIDATE_POSTS })
    ▼
Next.js Edge Cache purged → next request fetches fresh data from WP
```

**WordPress plugin code** (add to `functions.php` or a plugin):

```php
add_action('save_post', function($post_id) {
    if (wp_is_post_revision($post_id)) return;
    $post = get_post($post_id);
    wp_remote_post(
        'https://yoursite.com/api/revalidate?secret=' . getenv('REVALIDATE_SECRET'),
        [
            'body'    => json_encode(['slug' => $post->post_name]),
            'headers' => ['Content-Type' => 'application/json'],
        ]
    );
});
```

The secret must match `REVALIDATE_SECRET` in the Next.js deployment's env vars.

---

## Comment Cache

Comments use a shorter cache TTL (`revalidate: 300` — 5 minutes) and a post-scoped cache tag:

```typescript
tags: [`comments-${postId}`] // scoped to a specific post
```

`submitComment` (Server Action) calls:

```typescript
revalidateTag(`comments-${data.postId}`, { expire: 300 })
```

This means approving a comment in WP takes up to 5 minutes to appear on the site. Adjust `revalidate: 300` in `commentRepository.ts` if faster updates are needed.

---

## WordPress Configuration Requirements

| Setting                 | Where                             | Why                                                |
| ----------------------- | --------------------------------- | -------------------------------------------------- |
| REST API enabled        | Default in WP 4.7+                | Required for all data fetching                     |
| Allow comments          | Settings → Discussion             | `submitComment` Server Action requires this        |
| Permalinks enabled      | Settings → Permalinks → Post name | WP REST requires pretty permalinks                 |
| Yoast SEO (optional)    | Plugin                            | Provides `yoast_head_json` → `PostSeo` metadata    |
| CORS headers (optional) | Not needed                        | All WP fetches are server-side; CORS never applies |

---

## Adding `remotePatterns` for WP Media

Post featured images come from your WordPress media library. The domain must be in `next.config.ts`:

```typescript
images: {
  remotePatterns: [
    { protocol: 'https', hostname: '**.wordpress.com' },    // wordpress.com hosted
    { protocol: 'https', hostname: 'media.yourclub.com' },  // self-hosted media CDN
    { protocol: 'https', hostname: 'yourclub.com' },        // self-hosted WP
  ],
}
```

Without this, `next/image` returns a 500 for images from unlisted domains. The dev server will show a clear error message identifying the blocked hostname.

---

## Adding a New WP Entity

Follow this pattern (example: `WpUser`):

1. **DTO** — `src/persistence/wordpress/types/wpUser.dto.ts`
2. **Domain model** — `src/domain/user/user.model.ts`
3. **Mapper** — `src/persistence/wordpress/mappers/userMapper.ts` + test
4. **Repository** — `src/persistence/wordpress/repositories/userRepository.ts`
5. **Use case** (if needed) — `src/application/blog/getUserProfile.ts`
6. **Route** (if needed) — `src/app/author/[slug]/page.tsx`
