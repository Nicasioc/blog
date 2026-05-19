# Plan: Next.js 15 WordPress Blog with AdSense & SEO

## Context

Greenfield blog project. The goal is to build a content-rich UI in Next.js 15 (App Router, TypeScript) that fetches posts from an existing WordPress site via the REST API, serves ads via a pluggable provider system, and is optimized for organic search traffic. The codebase is white-labeled — the same repo deploys once per soccer team with different env vars.

---

## Hosting: Vercel

**Deployment model:** One Vercel project per soccer team, all pointing to the same GitHub repo. Each project has its own environment variables (team name, colors, WP URL, AdSense ID).

**How to set up a new team site:**

1. Go to Vercel dashboard → Add New Project → import the same repo
2. Set the team's env vars in the Vercel project settings
3. Assign a custom domain — done

**Hobby plan note:** Vercel Hobby prohibits commercial use. Since the goal is ad revenue, plan to upgrade to **Vercel Pro ($20/month)** before launching with live ads. Use Hobby for development and staging only.

**ISR on Vercel:** Works out of the box. `revalidate` constants in page files map directly to Vercel's Edge Cache TTLs. On-demand revalidation via `revalidateTag()` can be triggered from a WordPress webhook (add a Next.js API route as a WP hook endpoint).

---

## White-Label Architecture (Multi-Site)

The same codebase is deployed once per soccer team. Each deployment has its own env vars — no code changes between teams. What varies:

| Variable                           | Purpose                                  |
| ---------------------------------- | ---------------------------------------- |
| `NEXT_PUBLIC_SITE_NAME`            | "Real Madrid News"                       |
| `NEXT_PUBLIC_SITE_LOGO_URL`        | Logo image URL (CDN or relative path)    |
| `NEXT_PUBLIC_PRIMARY_COLOR`        | Team primary color (hex, e.g. `#FFFFFF`) |
| `NEXT_PUBLIC_SECONDARY_COLOR`      | Team secondary color (e.g. `#FFD700`)    |
| `WORDPRESS_API_URL`                | Each team's WP instance                  |
| `NEXT_PUBLIC_AD_PROVIDER`          | Ad provider for this deployment          |
| `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID` | Team's AdSense account                   |

**Theming approach:** CSS custom properties injected in the root layout from config. Tailwind components reference `var(--color-primary)` etc. — no component code changes between teams.

**`src/lib/siteConfig.ts`** — the central white-label config (all from env):

```typescript
export type SiteConfig = {
  siteName: string
  siteUrl: string
  logoUrl: string
  theme: { primary: string; secondary: string }
  adProvider: 'adsense' | 'gam' | 'prebid'
  adSensePublisherId: string
}
export const siteConfig: SiteConfig = { ... }  // validated from env
```

**shadcn CSS variable integration:** shadcn already uses CSS variables for its theme (`--primary`, `--secondary`, `--background`, etc.). The root layout overrides these per-team:

```typescript
<style>{`
  :root {
    --primary: ${siteConfig.theme.primary};       /* overrides shadcn's default --primary */
    --primary-foreground: ${siteConfig.theme.primaryForeground};
    --secondary: ${siteConfig.theme.secondary};
  }
`}</style>
```

All shadcn components (`Button`, `Card`, `Badge`, etc.) and custom blog components that use `bg-primary`, `text-primary` etc. automatically adopt the team's colors. No component code changes between team deployments.

---

## Phase 1 — Scaffold & Configure

```bash
# Run inside the repo root
npx create-next-app@latest . \
  --typescript --tailwind --app --src-dir \
  --import-alias "@/*" --eslint --use-npm

# Initialize shadcn (interactive — choose New York style, CSS variables: yes)
npx shadcn@latest init

# Additional deps
npm install zod @tailwindcss/typography
# Note: clsx and tailwind-merge are installed by shadcn init — do not duplicate

# Install shadcn components used in the blog
npx shadcn@latest add button card badge avatar separator skeleton
npx shadcn@latest add breadcrumb pagination
```

**shadcn notes:**

- Choose **New York** style during init (cleaner, better for content sites)
- Enable **CSS variables** in shadcn init — this is the backbone of our white-label theming
- shadcn installs components into `src/components/ui/` — do not edit these files directly; build blog-specific components in `src/components/post/`, `src/components/layout/` etc. that compose from `ui/`
- shadcn already includes `clsx` + `tailwind-merge` and creates `src/lib/utils.ts` with the `cn()` helper — use this instead of creating a separate `cn.ts`

**Files to create/edit immediately after scaffold:**

- `src/lib/env.ts` — Zod-validated env module (first file; everything else depends on it)
- `src/lib/siteConfig.ts` — white-label config assembled from env; used in layout + components
- `next.config.ts` — add `images.remotePatterns` for WP domain, security headers
- `.env.example` + `.env.local` — document required vars
- `tailwind.config.ts` / `globals.css` — extend shadcn's CSS variable theme with team colors; add `@tailwindcss/typography` plugin

**Environment variables:**

```
# Server-only
WORDPRESS_API_URL=https://yourwp.com/wp-json
REVALIDATE_POSTS=3600
REVALIDATE_PAGES=86400

# Client-safe (NEXT_PUBLIC_)
# White-label / per-team config
NEXT_PUBLIC_SITE_NAME=Real Madrid News
NEXT_PUBLIC_SITE_URL=https://realmadrid-news.com
NEXT_PUBLIC_SITE_LOGO_URL=https://cdn.example.com/real-madrid-logo.svg
NEXT_PUBLIC_PRIMARY_COLOR=#FFFFFF
NEXT_PUBLIC_SECONDARY_COLOR=#FFD700

# Ads
NEXT_PUBLIC_AD_PROVIDER=adsense          # 'adsense' | 'gam' | 'prebid'
NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=ca-pub-XXXXXXXXXXXXXXXX
```

---

## Phase 2 — Domain Models

**Files:** `src/domain/*/`

```
src/domain/
├── post/post.model.ts       — Post, FeaturedImage, PostSeo
├── category/category.model.ts
├── tag/tag.model.ts
├── author/author.model.ts
├── page/page.model.ts
└── seo/
    ├── jsonLd.model.ts      — ArticleJsonLd, BreadcrumbJsonLd (no schema-dts dep)
    └── metadata.utils.ts    — generatePostMetadata, generatePageMetadata
```

Key `Post` shape:

```typescript
type Post = {
  id: number
  slug: string
  title: string
  excerpt: string
  content: string
  publishedAt: Date
  modifiedAt: Date
  featuredImage: FeaturedImage | null
  author: Author
  categories: Category[]
  tags: Tag[]
  canonicalUrl: string
  seo: PostSeo | null
}
```

Also implement `src/utils/`: `logger.ts`, `guards.ts` (isNil, isNonEmptyString, isNonEmptyArray).
Use `src/lib/utils.ts` (created by shadcn init) for the `cn()` helper — do not duplicate it.

---

## Phase 3 — WordPress Persistence Layer

**Files:** `src/persistence/wordpress/`

```
persistence/wordpress/
├── wpClient.ts              — fetch wrapper; returns { data, totalItems, totalPages }
├── types/
│   ├── wpPost.dto.ts        — mirrors WP REST response exactly
│   ├── wpCategory.dto.ts
│   ├── wpTag.dto.ts
│   ├── wpAuthor.dto.ts
│   └── wpPage.dto.ts
├── mappers/
│   ├── postMapper.ts        — WpPostDto → Post  (most complex; see notes)
│   ├── categoryMapper.ts
│   ├── tagMapper.ts
│   ├── authorMapper.ts
│   └── pageMapper.ts
└── repositories/
    ├── postRepository.ts
    ├── categoryRepository.ts
    ├── tagRepository.ts
    ├── authorRepository.ts
    └── pageRepository.ts
```

**`wpClient.ts` design:**

- Always add `?_embed` — collapses author/media/terms into one request (avoids 4+ sequential fetches)
- Extract `X-WP-Total` + `X-WP-TotalPages` response headers for pagination
- Tag each fetch with `next: { tags: ['posts'] | ['post-{slug}'] }` for ISR revalidation
- Throw typed `WpApiError` with `.status` and `.endpoint` — lets application layer distinguish 404 (return null) from 5xx (rethrow)

**`postMapper.ts` notes:**

- Strip HTML from excerpt: `excerpt.replace(/<[^>]*>/g, '')`
- `_embedded['wp:term'][0]` = categories, `[1]` = tags
- Extract Yoast `yoast_head_json` field if present → `PostSeo`
- Never put HTML content into JSON-LD strings

**Repository key signatures:**

```typescript
fetchPostsList(params: { page: number; perPage?: number; categoryId?: number; tagId?: number }): Promise<WpFetchResult<WpPostDto[]>>
fetchPostBySlug(slug: string): Promise<WpPostDto | null>
fetchRelatedPosts(categoryIds: number[], excludeId: number): Promise<WpPostDto[]>
fetchAllPostSlugs(): Promise<Array<{ slug: string }>>  // for generateStaticParams
```

WP REST cannot filter by slug for taxonomies — must `GET /wp/v2/categories?slug=foo` first to get the ID.

---

## Phase 4 — Application Layer

**Files:** `src/application/`

```
application/
├── blog/
│   ├── getPostsList.ts       — { posts, pagination }
│   ├── getPostBySlug.ts      — { post, relatedPosts } | null
│   ├── getHomepageData.ts    — { featuredPost, recentPosts, categories }
│   ├── getCategoryArchive.ts — resolve slug→id, then paginated posts
│   └── getTagArchive.ts
└── page/
    └── getPageBySlug.ts
```

- `getPostBySlug` returns null (not throws) so route calls `notFound()`
- `getHomepageData` fetches 7 posts + categories in parallel via `Promise.all`
- Category/Tag archive use cases resolve taxonomy slug → ID before filtering

---

## Phase 5 — Routes & SEO

**Route structure:**

| Route              | File                           | revalidate | generateStaticParams |
| ------------------ | ------------------------------ | ---------- | -------------------- |
| `/`                | `app/page.tsx`                 | 1800s      | —                    |
| `/blog`            | `app/blog/page.tsx`            | 1800s      | —                    |
| `/blog/[slug]`     | `app/blog/[slug]/page.tsx`     | 3600s      | ✓ (all post slugs)   |
| `/category/[slug]` | `app/category/[slug]/page.tsx` | 3600s      | — (on-demand)        |
| `/tag/[slug]`      | `app/tag/[slug]/page.tsx`      | 3600s      | — (on-demand)        |
| `/page/[slug]`     | `app/page/[slug]/page.tsx`     | 86400s     | ✓ (all WP pages)     |
| `/sitemap.xml`     | `app/sitemap.ts`               | 86400s     | —                    |
| `/robots.txt`      | `app/robots.ts`                | static     | —                    |

**`app/layout.tsx`:**

- Load font via `next/font/google` with `display: 'swap'`
- AdSense script: `<Script src="...adsbygoogle.js?client={publisherId}" strategy="afterInteractive" crossOrigin="anonymous" />`
- Inject CSS variables for team theme into `:root`
- Base `Metadata` export with site name + title template
- `<Viewport>` export

**`generateStaticParams` at scale:** if WP has thousands of posts, limit to recent posts and keep `dynamicParams = true` (default) — avoids multi-minute builds.

**SEO per-route (`generateMetadata`):**

```typescript
// app/blog/[slug]/page.tsx
export async function generateMetadata({ params }) {
  const result = await getPostBySlug(params.slug)
  if (!result) return {}
  return generatePostMetadata(result.post)
}
```

`generatePostMetadata` in `src/domain/seo/metadata.utils.ts` returns full `Metadata` with:

- title, description, alternates.canonical
- openGraph (type: 'article', publishedTime, modifiedTime, images)
- twitter (card: 'summary_large_image')

**JSON-LD components** (`src/components/seo/`): Server Components only — `PostJsonLd.tsx`, `BreadcrumbJsonLd.tsx`. Render `<script type="application/ld+json">` with `JSON.stringify`. Required for Google rich results.

---

## Phase 6 — UI Components

```
src/components/
├── ui/                        — shadcn auto-generated (Button, Card, Badge, Avatar,
│                                Separator, Skeleton, Breadcrumb, Pagination, ...)
│                                DO NOT edit these files directly
├── layout/
│   ├── Header.tsx             — uses siteConfig for logo + nav colors; composes shadcn primitives
│   ├── Footer.tsx
│   ├── Sidebar.tsx            — pre-fetched categories as props; contains AdSlot
│   └── SiteLogo.tsx           — next/image logo from siteConfig.logoUrl
├── post/
│   ├── PostCard.tsx           — uses shadcn <Card> + next/image (explicit width/height for CLS)
│   ├── PostList.tsx
│   ├── PostBody.tsx           — splits content at 3rd </p>, injects AdSlot mid-content
│   ├── AuthorCard.tsx         — uses shadcn <Avatar>
│   └── RelatedPosts.tsx       — uses shadcn <Card>
├── navigation/
│   ├── Breadcrumb.tsx         — wraps shadcn <Breadcrumb>; renders BreadcrumbJsonLd
│   ├── Pagination.tsx         — wraps shadcn <Pagination>; offset-based (?page=N)
│   └── TagList.tsx            — uses shadcn <Badge>
├── ads/
│   ├── AdSlot.tsx             — provider-agnostic shell; delegates to active provider
│   ├── providers/
│   │   ├── AdSenseProvider.tsx   — 'use client'; adsbygoogle.push({})
│   │   └── PrebidProvider.tsx    — 'use client'; googletag / pbjs (stub for later)
│   └── AdProvider.tsx         — context + script loader for active provider
└── seo/
    ├── PostJsonLd.tsx
    └── BreadcrumbJsonLd.tsx
```

### Ad Abstraction Layer

The goal is **provider-agnostic placement**: page/component code only uses `<AdSlot>` with a `placement` name. The underlying provider is swapped via config without touching any page.

**`src/services/ads/adConfig.ts`** — defines placements independently of provider:

```typescript
export type AdPlacement = 'header-leaderboard' | 'in-content' | 'sidebar' | 'footer'

export type AdSlotConfig = {
  placement: AdPlacement
  sizes: Array<[number, number]>     // e.g. [[728,90],[970,90]]
}

export const AD_PLACEMENTS: Record<AdPlacement, AdSlotConfig> = { ... }
```

**`AdSlot.tsx`** — calls `useAdProvider()` from context and renders whatever the active provider returns:

```typescript
'use client'
const { renderSlot } = useAdProvider()
return renderSlot(placement, className)
```

**`AdProvider.tsx`** — reads `NEXT_PUBLIC_AD_PROVIDER` env var, loads the correct script, exposes `renderSlot` via context. Defaults to `'adsense'`.

**`AdSenseProvider.tsx`** — current default. Calls `adsbygoogle.push({})` per slot in `useEffect`.

**`PrebidProvider.tsx`** — stub. When ready: add GAM account + SSP seats, implement Prebid.js config, flip `NEXT_PUBLIC_AD_PROVIDER=prebid`. No component changes needed.

**`PostBody.tsx` in-content ad:**

```typescript
// Server Component splits content, wraps halves in ContentHtml (client), inserts AdSlot between
const parts = content.split('</p>')
const splitAt = Math.min(3, Math.floor(parts.length / 2))
// <ContentHtml html={before} /> <AdSlot placement="in-content" /> <ContentHtml html={after} />
```

Apply `prose` Tailwind Typography class to post content wrapper.

### Ad Provider Migration Path

1. **Now** → AdSense (`NEXT_PUBLIC_AD_PROVIDER=adsense`). No GAM needed.
2. **Header bidding** → GAM account + Prebid.js with SSP adapters (Amazon TAM, Criteo, etc.), implement `PrebidProvider`, flip env var.
3. `<AdSlot>` interface never changes — placements are stable across provider migrations.

---

## Verification Checklist

1. `npm run build` — zero TypeScript and lint errors
2. `npm start` — homepage, post page, category page all render
3. `/sitemap.xml` — valid XML with post/page/category URLs
4. `/robots.txt` — correct disallow rules + sitemap reference
5. Browser devtools — AdSense script loads (`afterInteractive`), `adsbygoogle.push` fires after hydration
6. Google Rich Results Test — Article + BreadcrumbList pass
7. Social media debugger — OG title/description/image correct on post pages
8. Lighthouse (local build) — Performance ≥ 90, no CLS from images

---

## Key Gotchas

| Area         | Issue                                   | Fix                                        |
| ------------ | --------------------------------------- | ------------------------------------------ |
| WP REST      | Pagination counts in headers, not body  | Extract `X-WP-Total` in wpClient           |
| WP REST      | No slug-based taxonomy filter           | Resolve slug→ID first                      |
| next/image   | 500 if WP domain not in remotePatterns  | Add WP hostname to next.config.ts          |
| AdSense      | `adsbygoogle.push` crashes on server    | 'use client' + useEffect only              |
| JSON-LD      | Never embed raw HTML strings            | Strip HTML in mapper                       |
| Tailwind v4  | CSS-first config, no tailwind.config.ts | Use `@tailwindcss/typography@next`         |
| Large sites  | generateStaticParams times out          | Limit to recent posts + dynamicParams=true |
| CORS         | Not an issue server-side                | Keep all WP fetches server-side            |
| Vercel Hobby | Commercial use prohibited               | Upgrade to Pro before going live with ads  |
