# SEO conventions

Living notes on how this site presents itself to search engines. Started under
the "SEO: Fix Discovered – currently not indexed" project.

## Indexing policy per route

| Route              | Indexable | Notes                                                               |
| ------------------ | --------- | ------------------------------------------------------------------- |
| `/`                | yes       | Self-canonical.                                                     |
| `/blog`            | yes       | Paginated; canonical is page-aware.                                 |
| `/blog/[slug]`     | yes       | `Article` + `BreadcrumbList` JSON-LD. Canonical from the CMS.       |
| `/category/[slug]` | yes       | Unique intro copy + `CollectionPage` JSON-LD. Canonical page-aware. |
| `/tag/[slug]`      | **no**    | `robots: noindex, follow`. See below.                               |
| `/page/[slug]`     | yes       | CMS-managed pages. Self-canonical.                                  |
| Static legal pages | yes       | `/privacy`, `/terms`, `/contact`, `/about`.                         |

## Tag archives are `noindex, follow` (BLO-150)

Tag pages render the same list UI as category archives with no unique copy and
are near-duplicates of each other. Indexing them spends crawl budget that should
go to posts and category pages. They stay `follow` so `TagList` links still aid
discovery, and they are excluded from `sitemap.xml`.

Set in `generateTagMetadata` (`src/domain/seo/metadata.utils.ts`).

## Canonical URLs

`buildCanonicalUrl(siteUrl, path, page)` in `src/domain/seo/metadata.utils.ts`
is the only place canonicals are built. It strips a trailing slash from the site
URL and appends `?page=N` for page ≥ 2, so every paginated route
self-canonicalises to its own page instead of collapsing onto page 1.

| Route              | Canonical                                     |
| ------------------ | --------------------------------------------- |
| `/`                | `{siteUrl}`                                   |
| `/blog?page=N`     | `{siteUrl}/blog` (+ `?page=N` for N ≥ 2)      |
| `/blog/[slug]`     | `{siteUrl}/blog/{slug}` (derived in mapper)   |
| `/category/[slug]` | `{siteUrl}/category/{slug}` (+ `?page=N`)     |
| `/tag/[slug]`      | `{siteUrl}/tag/{slug}` (+ `?page=N`; noindex) |
| `/page/[slug]`     | `{siteUrl}/page/{slug}`                       |
| Static legal pages | `{siteUrl}{href}`                             |

`siteConfig.siteUrl` is trailing-slash-normalised at the source. `next.config`
sets no `trailingSlash`, so URLs have no trailing slash — matching the canonicals.

## Sitemap (`src/app/sitemap.ts`)

- Every entry carries a `lastModified`. Posts/pages/categories use their own
  `updatedAt`; `/` and `/blog` use the most recent post date.
- The mappers use the Unix epoch as "no usable date"; the sitemap collapses
  epoch/invalid dates to build time so it never advertises a 1970 timestamp.
