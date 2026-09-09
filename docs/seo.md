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

## Sitemap (`src/app/sitemap.ts`)

- Every entry carries a `lastModified`. Posts/pages/categories use their own
  `updatedAt`; `/` and `/blog` use the most recent post date.
- The mappers use the Unix epoch as "no usable date"; the sitemap collapses
  epoch/invalid dates to build time so it never advertises a 1970 timestamp.
