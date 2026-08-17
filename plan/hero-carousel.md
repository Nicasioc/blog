# Homepage Hero Carousel

> **Status:** Planned, not started. No code written.
> **Blocked on:** creating the Linear project — the Linear MCP connection was unavailable for the whole planning session.

## Resuming this work

This plan was produced in a Claude Code session. To continue with full context:

```bash
cd /home/nicasio/projectos/blog
CLAUDE_CONFIG_DIR=/home/nicasio/.claude-persona claude --resume 1a5abc0b-62fe-4a34-a04f-5d8834d3a942
```

`CLAUDE_CONFIG_DIR` is required: this machine stores sessions under `~/.claude-persona`, not the default `~/.claude`. Without it `--resume` will not find the transcript. If that variable is already exported in your shell profile, plain `claude --resume <id>` works.

|                         |                                                                                                      |
| ----------------------- | ---------------------------------------------------------------------------------------------------- |
| Session ID              | `1a5abc0b-62fe-4a34-a04f-5d8834d3a942`                                                               |
| Transcript              | `~/.claude-persona/projects/-home-nicasio-projectos-blog/1a5abc0b-62fe-4a34-a04f-5d8834d3a942.jsonl` |
| Working dir             | `/home/nicasio/projectos/blog`                                                                       |
| Branch at planning time | `nicasioc/blo-80-publish-article-script`                                                             |
| Planned on              | 2026-08-16                                                                                           |

**First thing to do on resume:** run `/mcp` and reconnect Linear _inside the session_. Claude Code resolves its MCP server list at session start, so a reconnect done in the desktop/web integration settings does not reach a running session. This was the exact blocker — Linear first returned `permission_error: Unable to verify organization membership`, then dropped out of the session entirely. If the tools come back but the membership error returns, the connected Linear account genuinely lacks access to the `adver` workspace, which is an account-level fix.

**Still unanswered:** whether these issues should carry estimates and labels. The workspace was never readable, so the team's estimate scale and label set are unknown.

---

## Context

The homepage renders a single "featured" post (`src/app/page.tsx`), but that post is not editorial at all — `getHomepageData` takes `posts[0]` by positional destructuring. It reads as one more card rather than a hero, and no one can choose which story leads the site.

This replaces it with a 3-slide hero carousel and introduces real editorial control over what appears there. It spans **two repos** and folds in a latent ordering bug found during planning.

**Decisions confirmed with the user:**

- **Selection: hybrid.** A `featured` checkbox in Payload takes priority; remaining slots backfill with the most recent posts until 3 are filled. Never empty (works with zero editorial effort), never stale (one old featured post can't be the only thing showing).
  - Rejected: _latest-3 only_ (no editorial control), _featured-only_ (breaks the day nobody ticks a box), _tag-based_ (a `destacado` tag would create a public, indexable `/tag/destacado` archive and leak editorial config into the public taxonomy).
- **Manual carousel only** — arrows, dots, native touch swipe. No autoplay.
- **CSS scroll-snap, zero new dependencies.** No slider library is installed and the repo is deliberately dependency-light (Base UI only, no Radix/Embla family).
- **Full-bleed image slides** with a gradient scrim, plus a fallback for posts with no `featuredImage`.

---

## Repos

- **Blog:** `/home/nicasio/projectos/blog` — branch `nicasioc/blo-80-publish-article-script` at planning time.
- **CMS:** `/home/nicasio/projectos/cms` — separate repo, on `main`, needs a new branch. Uses **pnpm** (not npm). Had uncommitted scratch files at planning time.

---

## Linear project to create

| Field   | Value                                                                                                                                                        |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Name    | Homepage hero carousel                                                                                                                                       |
| Team    | BLO (workspace `adver`)                                                                                                                                      |
| Summary | Replace the homepage's pseudo-featured post with an editorially controlled 3-slide hero carousel; adds a `featured` flag in Payload and fixes post ordering. |

**Project description** (paste as-is):

> The homepage "featured" post is just `posts[0]` — there is no way for an editor to choose what leads the site. This project adds a hero carousel showing 3 posts, selected by a hybrid rule: posts explicitly marked `featured` in Payload come first, and the remaining slots backfill with the most recent posts. The hero is therefore never empty and never stale.
>
> Spans two repos: `cms` (new `featured` field + migration) and `blog` (data plumbing, selection logic, carousel UI).
>
> Also fixes a latent bug found during planning: `payloadFetch` has no `sort` support, so posts are currently ordered by `createdAt` rather than `publishedAt`. "Latest" is already subtly wrong site-wide.

### Milestones

| #   | Milestone       | Issues     | Ships when                                                                                       |
| --- | --------------- | ---------- | ------------------------------------------------------------------------------------------------ |
| M1  | Data foundation | 1, 2, 3, 4 | Payload has a `featured` flag, posts sort by publish date, and the blog can query both           |
| M2  | Selection logic | 5, 6       | `getHomepageData` returns a correct 3-post `heroPosts` array with no overlap into "Latest posts" |
| M3  | Hero UI         | 7, 8       | The carousel is live on the homepage                                                             |

M1 is the only milestone crossing repos. M2 is pure blog-side logic. M3 is presentation only — by then the data contract is fixed, so the UI can be iterated without touching the data layer.

---

## Issues

Eight issues. **2 and 5 are unblocked** and can start immediately, in parallel with the CMS work.

### 1. [CMS] Add `featured` checkbox to Posts collection + migration

**M1 · repo: cms · blocks: 3**

Add to the `fields` array in `cms/src/collections/Posts.ts`, after `publishedAt`:

```ts
{
  name: 'featured',
  type: 'checkbox',
  defaultValue: false,
  admin: {
    position: 'sidebar',
    description: 'Show this post in the homepage hero carousel.',
  },
},
```

Add `'featured'` to `admin.defaultColumns` so editors can see what is promoted from the list view.

`defaultValue: false` matters — without it existing rows return `null` and `where[featured][equals]=true` behaves inconsistently across adapters.

**A migration is mandatory.** The CMS runs Postgres with `push: false` (`cms/src/payload.config.ts:61`), has a committed `src/migrations/` directory, and CI runs `payload migrate && pnpm build`:

```bash
pnpm payload migrate:create add_featured_to_posts
pnpm generate:types
pnpm payload migrate
```

Commit the generated `.ts` **and** `.json` pair — existing migrations show both are tracked.

**Done when:** the checkbox appears in the post sidebar and list columns, and the migration is committed.

---

### 2. [Blog] Add `sort` support to payloadFetch and order posts by publishedAt

**M1 · repo: blog · unblocked — can start now**

Standalone bug fix. `payloadFetch` serializes `depth`, `limit`, `page`, `where`, `select` — but not `sort`, so posts come back in Payload's default `createdAt` order.

- `src/persistence/payload/payloadClient.ts` — add `sort?: string` to `PayloadFetchOptions`, destructure it, and `url.searchParams.set('sort', sort)` when defined.
- `src/persistence/payload/repositories/postRepository.ts` — add `const POSTS_SORT = '-publishedAt'`; pass it in `fetchPostsList` and `fetchRelatedPosts`.

**Watch out:** `postRepository.test.ts` asserts exact `payloadFetch` args. `expect.objectContaining` survives the new key, but any exact-equality assertion needs updating.

**Note:** changes ordering site-wide — homepage, `/blog`, category and tag archives. Intended, but visible beyond the hero.

**Done when:** tests assert `sort` is sent; archives are ordered by publish date.

---

### 3. [Blog] Carry `featured` through DTO, mapper and domain model

**M1 · repo: blog · blocked by: 1 · blocks: 4**

Three mechanical changes, each with a test update:

- `src/persistence/payload/types/payloadPost.dto.ts` — `featured?: boolean | null`
- `src/domain/post/post.model.ts` — `featured: boolean`
- `src/persistence/payload/mappers/postMapper.ts` — `featured: dto.featured === true`

The `=== true` coercion is deliberate and matches the file's existing defensive posture (`extractFeaturedImage`, `extractAuthor`): the field is `undefined` on posts created before issue 1 and may be `null` from the database.

**Done when:** `postMapper.test.ts` covers `true` / `false` / `undefined` / `null`.

---

### 4. [Blog] Add `featured` filter to fetchPostsList

**M1 · repo: blog · blocked by: 3 · blocks: 6**

Add `featured?: boolean` to `PostsListParams` and `buildPostsWhere` in `postRepository.ts`:

```ts
if (featured === true) where.featured = { equals: true }
```

Chosen over a separate `fetchFeaturedPosts()` because it reuses the existing where-builder, sort, cache tag (`'posts'`), revalidate config, and mapping — a separate function would duplicate all of that for one where-clause key.

**Done when:** a test asserts the where clause is added only when `featured: true`.

---

### 5. [Blog] Add `selectHeroPosts` domain function

**M2 · repo: blog · blocks: 6 · unblocked — pure logic, can start now**

New: `src/domain/post/selectHeroPosts.ts`

```ts
export const selectHeroPosts = (featured: Post[], recent: Post[], count = 3): Post[]
```

Featured first in the order given, then append from `recent` any post whose `id` is not already present, until `count`. Pure, no mutation (`filter`/`concat`/`slice`).

Edge cases to implement and test:

- both empty → `[]`
- fewer than `count` available → return what exists, no padding
- more than `count` featured → truncate
- post in **both** arrays → appears once, in its featured position
- duplicate ids within `featured` → deduped
- `count` 0 or negative → `[]`
- `null` / `undefined` / non-array inputs → treated as empty

**Done when:** `selectHeroPosts.test.ts` has one case per bullet.

---

### 6. [Blog] Reshape getHomepageData to return heroPosts

**M2 · repo: blog · blocked by: 4, 5 · blocks: 8**

Replace `featuredPost: Post | null` with `heroPosts: Post[]` in `HomepageData`.

```ts
const [featuredResult, postsResult, categories] = await Promise.all([
  fetchPostsList({ perPage: HERO_POST_COUNT, featured: true }),
  fetchPostsList({ perPage: HOMEPAGE_POST_COUNT }),
  fetchAllCategories(),
])
const heroPosts = selectHeroPosts(featuredResult.posts, postsResult.posts, HERO_POST_COUNT)
const heroIds = new Set(heroPosts.map((p) => p.id))
const recentPosts = postsResult.posts.filter((p) => !heroIds.has(p.id))
```

`recentPosts` **must** exclude hero posts or the same post renders twice on the page. The third fetch joins the existing `Promise.all`, so no added latency.

**Watch out:** `fetchPostsList` is now called twice — the existing test mocks it once. Needs `mockResolvedValueOnce` ordering or arg-based branching. Both existing cases assert the old `featuredPost` shape and must be rewritten.

**Done when:** tests cover prefers-featured, backfills, and no hero/recent overlap.

---

### 7. [Blog] Build the HeroCarousel component

**M3 · repo: blog · blocks: 8 · can be built against fixtures before 6 lands**

New: `src/components/home/HeroCarousel.tsx` (`'use client'` — needs scroll state and click handlers).

Scroll-snap track:

```
<div class="flex snap-x snap-mandatory overflow-x-auto scroll-smooth
            [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
  <article class="snap-center shrink-0 w-full"> ... </article>
</div>
```

- **Active slide via `IntersectionObserver`**, not a scroll handler — reports the visible slide directly, no debouncing, and stays correct when the user swipes natively rather than clicking.
- **Arrows:** `Button variant="secondary" size="icon"` + `ChevronLeftIcon`/`ChevronRightIcon`, driving `scrollTo({ left: index * width })`. Disabled at the ends (no loop). `aria-label` on each.
- **Dots:** real `<button>`s with `aria-label` and `aria-current` — keyboard reachable, not decorative divs.
- `aria-roledescription="carousel"` on the section, `"slide"` on each item.
- Guard `behavior: 'smooth'` behind `prefers-reduced-motion`.
- **No-JS:** the track stays scrollable and swipeable; controls are simply inert. Nothing is hidden behind JS.
- Single post → no arrows or dots. Empty → render nothing.

**Slide visual** (design tokens only — see the theming rules in `CLAUDE.md`):

- Wrapper `relative aspect-[16/9] md:aspect-[21/9] overflow-hidden rounded-xl`
- `next/image` `fill`, `object-cover`, `sizes="(min-width: 1024px) 66vw, 100vw"`, `priority` on **slide 1 only** — it is the LCP element, and marking the rest priority makes them compete for bandwidth
- Scrim `absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent` — a legibility scrim over an arbitrary photo, deliberately not a brand token
- Text `absolute inset-x-0 bottom-0 p-6 md:p-8`: category `Badge`, `h2` (`text-2xl md:text-4xl font-bold text-balance text-white`), excerpt (`line-clamp-2 text-white/80`, hidden on small screens)
- **No image:** `bg-primary` background, no scrim — legible via `--brand-primary-foreground`
- Whole slide wrapped in a `Link` to `/blog/${post.slug}`

**Done when:** `HeroCarousel.test.tsx` covers slide count, dot count, single-post control hiding, and the no-image fallback. Note `IntersectionObserver` and `scrollTo` are not implemented in jsdom and must be stubbed.

---

### 8. [Blog] Wire the hero into the homepage

**M3 · repo: blog · blocked by: 6, 7**

In `src/app/page.tsx`, remove the "Featured / Editor's pick" `SectionHeading` + `PostCard` block and render `{heroPosts.length > 0 && <HeroCarousel posts={heroPosts} />}` **full-width above** the two-column grid, so it reads as a hero rather than a card inside a column.

**Done when:** the homepage shows the carousel above the grid and no post appears both in the hero and in "Latest posts".

---

## Verification (end to end, after issue 8)

1. `npm run lint && npm run typecheck && npm run test:run` in blog — all green.
2. CMS: **Featured** checkbox visible in the post sidebar and list columns.
3. Tick `featured` on an older post → it becomes **slide 1**, with the two most recent backfilling slides 2–3.
4. Untick everything → hero silently falls back to the latest 3. **The key resilience check.**
5. No post appears in both the hero and "Latest posts".
6. Arrows move one slide and disable at the ends; dots jump and track the active slide; **trackpad/touch swipe also updates the dots** — this proves the `IntersectionObserver` path, not just the click path.
7. Keyboard: tab to arrows and dots, activate with Enter/Space.
8. A post with no featured image renders the `bg-primary` fallback legibly.
9. Dev console clean — no hydration errors. This repo has already hit two, and the carousel is the homepage's first stateful client component.
10. Screenshot `/` at 1440px and ~390px to confirm the responsive aspect-ratio change.

## Risks and ordering

- **Ship the CMS field before the blog code.** The repos deploy independently; a blog deploy querying a column that does not exist will fail.
- Until issue 1 lands, `where[featured][equals]=true` may error or return everything depending on the adapter — the blog side cannot be honestly tested before it.
- Issue 2 changes post ordering across the whole site, not just the hero.
