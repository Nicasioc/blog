# Architecture

## Dependency Direction

```
src/app/
    └──► src/application/
              └──► src/domain/          (pure models, no deps)
              └──► src/persistence/     (Payload CMS REST — the only data source)
              └──► src/services/        (ad config)

src/components/
    └──► src/application/ outputs (domain types)
    └──► src/lib/ (siteConfig, cn)
    └──► src/services/ (adConfig)

src/lib/          ◄── shared by everything (env, siteConfig, utils)
```

**Rules:**

- `domain/` must not import from `app/`, `application/`, `persistence/`, `components/`, or `services/`
- `persistence/` imports from `domain/` for output types only — never the reverse
- `components/` never imports from `persistence/` directly
- Routes (`app/`) never import from `persistence/` **except** for `generateStaticParams` (the one accepted exception)

---

## Layers

### `src/app/` — Routes & Framework Wiring

Next.js App Router files only. Each route file:

- Exports `revalidate` constant
- Calls one or more use cases from `src/application/`
- Calls `notFound()` when the use case returns `null`
- Exports `generateMetadata` using helpers from `src/domain/seo/metadata.utils.ts`
- Exports `generateStaticParams` (allowed to import from `src/persistence/` for slug lists only)

```
app/
├── layout.tsx              # Root layout: font, CSS vars, AdSense script, <Providers>
├── page.tsx                # Homepage (revalidate: 1800)
├── providers.tsx           # 'use client' AdProvider wrapper
├── robots.ts               # /robots.txt
├── sitemap.ts              # /sitemap.xml (revalidate: 86400)
├── blog/page.tsx           # Blog listing (revalidate: 1800)
├── blog/[slug]/page.tsx    # Post detail (revalidate: 3600)
├── category/[slug]/page.tsx
├── tag/[slug]/page.tsx
├── page/[slug]/page.tsx    # CMS static pages (revalidate: 86400)
└── api/revalidate/route.ts # ISR webhook — POST from the CMS (per-tenant secret)
```

### `src/application/` — Use Cases

Thin orchestration layer. Each function:

- Calls one or more repository functions
- Owns null/not-found logic (returns `null`, never throws)
- Uses `Promise.all` for parallel fetches
- Returns domain types — never raw DTOs

```
application/
├── blog/
│   ├── getHomepageData.ts      # fetchPostsList + fetchAllCategories in parallel
│   ├── getPostsList.ts         # fetchPostsList → PostsListData
│   ├── getPostBySlug.ts        # fetch post, then relatedPosts + comments in parallel
│   ├── getCategoryArchive.ts   # resolve slug→ID, then paginated posts
│   ├── getTagArchive.ts        # same pattern as category
│   └── submitComment.ts       # 'use server' Server Action; creates a Comment via the CMS
└── page/
    └── getPageBySlug.ts        # thin pass-through (keeps routes clean)
```

### `src/domain/` — Pure Models

Zero framework dependencies. TypeScript types and pure utility functions only.

```
domain/
├── author/author.model.ts
├── category/category.model.ts
├── tag/tag.model.ts
├── post/post.model.ts          # Post, FeaturedImage, PostSeo
├── page/page.model.ts          # Page (a CMS "page" content type)
├── comment/comment.model.ts    # Comment (tree), CommentSubmission
├── shared/pagination.model.ts  # PaginationInfo
└── seo/
    ├── jsonLd.model.ts         # ArticleJsonLd, BreadcrumbJsonLd, etc.
    └── metadata.utils.ts       # generatePostMetadata, etc. — imports Metadata from 'next'
                                # (only allowed domain/ file to import from next)
```

### `src/persistence/payload/` — data access

Payload CMS over REST — the only data source. Full details in `docs/payload-integration.md`.

- **`payloadClient.ts`** — `payloadFetch<T>(endpoint, options)`. Builds the query
  (`depth`, `where[field][op]`, `select`, `sort`), adds the `where[tenant][equals]=<id>`
  filter to every request (`PAYLOAD_TENANT_SLUG` → `resolveTenantId`), sets Next ISR tags,
  and normalises the `{ docs, totalDocs, totalPages }` body to `PayloadFetchResult<T>`.
  `payloadWriteClient.ts` is the authenticated equivalent for writes. `payloadError.ts` —
  `PayloadApiError`.
- **`types/`** — `payload<Entity>.dto.ts`, mirroring the API response shape.
- **`mappers/`** — pure functions, DTO → domain model (`postMapper`, `authorMapper`,
  `categoryMapper`, `tagMapper`, `pageMapper`, `commentMapper` — the last also builds the
  comment tree). No async, no side effects.
- **`repositories/`** — call `payloadFetch`, apply mappers, return domain types
  (`postRepository`, `categoryRepository`, `tagRepository`, `authorRepository`,
  `pageRepository`, `commentRepository`).

Media: `featuredImage.url` is the CMS proxy path `/api/media/file/<name>`, resolved to the
CMS origin by the `/api/media/file/*` rewrite in `next.config.ts`.

### `src/components/` — UI Only

No data fetching. No business logic. Composed from shadcn primitives.

```
components/
├── ui/           # shadcn auto-generated — NEVER edit these files directly
├── ads/          # AdProvider (context), AdSlot (wrapper), providers/
├── layout/       # Header, Footer, Sidebar, SiteLogo
├── navigation/   # Breadcrumb, Pagination, TagList
├── post/         # PostCard, PostList, PostBody, AuthorCard, RelatedPosts,
│                 # CommentItem, CommentList, CommentForm, ContentHtml
└── seo/          # PostJsonLd, BreadcrumbJsonLd (Server Components only)
```

### `src/services/ads/` — Ad Configuration

`adConfig.ts` defines the 4 `AdPlacement` values and maps each to sizes + AdSense slot IDs read from env. This is the only place placement config lives — `AdSlot` components reference it.

### `src/lib/` — Shared Initializers

- `env.ts` — Zod-validated `serverEnv` and `clientEnv`; throws on startup if vars are missing
- `siteConfig.ts` — `SiteConfig` type and singleton; assembled from `clientEnv`
- `utils.ts` — `cn()` helper (clsx + tailwind-merge); created by shadcn init

### `src/utils/` — Generic Helpers

- `checks.ts` — `isNil`, `isNonEmptyString`, `isNonEmptyArray`, `isNonEmptyObject`
- `logger.ts` — structured JSON logger; silent in `test` env; `error/warn/info/debug`

---

## shadcn / Base UI Note

This project uses shadcn with the **New York** style and `@base-ui/react` as the primitive layer (not Radix UI). This means:

- `Badge` and `BreadcrumbLink` use a `render` prop instead of `asChild`:

  ```tsx
  // ✅ Correct
  <Badge variant="outline" render={<Link href="/category/foo" />}>Football</Badge>

  // ❌ Wrong (asChild doesn't exist here)
  <Badge asChild><Link href="/category/foo">Football</Link></Badge>
  ```

- `Avatar` uses `AvatarPrimitive` from `@base-ui/react/avatar`; `AvatarFallback` auto-hides when image loads
- `Separator` comes from `@base-ui/react/separator`
- Do **not** edit files in `src/components/ui/` directly — re-run `npx shadcn@latest add <component>` to update

---

## Accepted Rule Exceptions

| File                               | Exception                                    | Reason                                        |
| ---------------------------------- | -------------------------------------------- | --------------------------------------------- |
| `src/domain/seo/metadata.utils.ts` | Imports `Metadata` from `next`               | Type-only import; zero runtime impact         |
| `app/blog/[slug]/page.tsx`         | Imports `fetchAllPostSlugs` from persistence | `generateStaticParams` only; not in page body |
| `app/page/[slug]/page.tsx`         | Imports `fetchAllPageSlugs` from persistence | Same — `generateStaticParams` only            |
