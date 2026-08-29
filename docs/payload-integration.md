# Payload CMS Integration

The blog reads all content from a shared Payload CMS over its REST API — never a direct DB
connection. One Payload instance backs every white-label tenant; this app is scoped to one
tenant via `PAYLOAD_TENANT_SLUG`.

## How Data Flows

```
Payload CMS REST API  (admin.vex-agency.com/api)
      │  ?depth=2&where[...]&select[...]
      ▼
src/persistence/payload/payloadClient.ts    (payloadFetch — fetch wrapper, tenant scoping, ISR tags)
      │  PayloadPostDto, PayloadCategoryDto, …
      ▼
src/persistence/payload/mappers/            (DTOs → domain models)
      │  Post, Category, Tag, Author, Page, Comment
      ▼
src/persistence/payload/repositories/       (typed query functions)
      │  fetchPostsList(), fetchPostBySlug(), createComment(), …
      ▼
src/application/blog/                       (use cases)
      │  getPostBySlug(), getHomepageData(), …
      ▼
src/app/ routes                             (render)
```

## Query & pagination shape

Payload returns everything in the JSON body (no header parsing):

```jsonc
{ "docs": [ … ], "totalDocs": 147, "totalPages": 15, "page": 1 }
```

`payloadFetch` maps this to `{ data: docs, totalItems: totalDocs, totalPages }`.

- **`depth`** — how many relationship levels to populate. `payloadFetch` defaults to `2`, so
  `post.author`, `post.categories[]`, `post.featuredImage` come back as objects, not ids.
  Mappers guard with `isNonEmptyObject` and fall back when a relation is an unpopulated id.
- **`where`** — passed as `where[field][operator]=value` query params (e.g.
  `where[slug][equals]=my-post`, `where[_status][equals]=published`). `payloadFetch` takes a
  `WhereClause` object and serialises it.
- **`select`** — `select[field]=true` to trim the response.
- **`sort`** — a field name, `-` prefix for descending (e.g. `-publishedAt`).

Payload filters by **slug directly** — no slug→id round trip. Repositories query
`where[slug][equals]=…` and read `result.data[0]` (or `null` if empty).

## Tenant scoping

Every content read is scoped to this deployment's tenant:

```
serverEnv.PAYLOAD_TENANT_SLUG
  → resolveTenantId()               // GET /tenants?where[slug][equals]=… (authenticated)
  → payloadFetch adds where[tenant][equals]=<id> to every request (scopeToTenant: true)
```

`resolveTenantId` is the one call that sends the API key (`Authorization: users API-Key …`)
— the Tenants collection isn't publicly readable (it holds `revalidateSecret`). The
resolved id is cached under the `tenant` ISR tag. Content reads themselves are unauthenticated
and rely on Payload's public-read access rules plus this `tenant` filter.

> Server-side enforcement of that filter (so the CMS rejects cross-tenant reads rather than
> trusting the query) is tracked in BLO-130.

Archive-page filters (`categoryId` / `tagId` from `getCategoryArchive` / `getTagArchive`)
are layered on top of the tenant filter — they are not a scoping mechanism.

## Content HTML

Posts and pages carry a pre-rendered `contentHtml` field (generated CMS-side from the
Lexical richtext). Mappers pass it straight through to `Post.content` / `Page.content`;
`<ContentHtml>` renders it.

## Dates

Payload returns ISO-8601 UTC strings (`publishedAt`, `updatedAt`) with the `Z` suffix, so
`new Date(dto.publishedAt)` is correct as-is — no `'Z'` fixup. `postMapper` falls back to
`updatedAt` when `publishedAt` is absent (drafts).

## ISR webhook

Revalidation is driven from the **CMS side**: Payload's `afterChange`/`afterDelete` hooks on
Posts/Pages/Comments POST `{ slug }` to this tenant's `blogUrl` + `/api/revalidate?secret=…`
(the tenant's `blogUrl` and `revalidateSecret` are fields on the CMS Tenants collection).

```
Payload afterChange (published post) ──► POST https://<blogUrl>/api/revalidate?secret=<revalidateSecret>
                                          Body: { "slug": "the-post-slug" }
                                              ▼
                                    src/app/api/revalidate/route.ts
                                          │  timing-safe compare vs serverEnv.REVALIDATE_SECRET
                                          │  revalidateTag('post-<slug>'), revalidateTag('posts')
                                              ▼
                                    Next cache purged → next request re-fetches from the CMS
```

`REVALIDATE_SECRET` in this deployment must equal the tenant's `revalidateSecret` in the CMS.
There is no plugin/`functions.php` to install — it's all Payload config.

## Comment cache

Comment reads use a shorter TTL and a post-scoped tag (`comments-<postId>`); see
`commentRepository.ts`. Approving a comment in the CMS purges that tag via the CMS
revalidation hook.

## Media

`media.url` from the CMS is the proxy path `/api/media/file/<filename>` (Payload access
control stays on at the CMS, so it's not a raw Cloudinary URL). `next.config.ts` rewrites
`/api/media/file/*` on this domain through to the CMS origin, so `next/image` treats it as a
local path — **no `remotePatterns` entry is needed** for CMS media. See `next.config.ts`.

## Adding a new entity

Mirror the existing pattern (example: a `Series` collection):

1. **DTO** — `src/persistence/payload/types/payloadSeries.dto.ts` (mirror the API response)
2. **Domain model** — `src/domain/series/series.model.ts`
3. **Mapper** — `src/persistence/payload/mappers/seriesMapper.ts` (+ `.test.ts`, pure function)
4. **Repository** — `src/persistence/payload/repositories/seriesRepository.ts` — call
   `payloadFetch<PayloadSeriesDto>('/series', { … })`, apply the mapper, return domain types
5. **Use case** (if the route needs orchestration) — `src/application/blog/getSeries.ts`
6. **Route** (if needed) — `src/app/series/[slug]/page.tsx`
