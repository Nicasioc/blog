# Development Guide

## Prerequisites

- Node.js 20+ (`node --version`)
- npm 10+ (comes with Node 20)
- A running WordPress instance with REST API enabled (or use a public WP.com site for development)

## First-Run Setup

```bash
# 1. Install deps
npm install

# 2. Create your local env file
cp .env.example .env.local

# 3. Fill in at minimum:
#    WORDPRESS_API_URL — e.g. https://demo.wp-api.org/wp-json
#    NEXT_PUBLIC_SITE_NAME — any name
#    NEXT_PUBLIC_SITE_URL — http://localhost:3000
#    NEXT_PUBLIC_SITE_LOGO_URL — any image URL or /favicon.ico
#    NEXT_PUBLIC_PRIMARY_COLOR — any 6-digit hex e.g. "#13294b"
#    NEXT_PUBLIC_SECONDARY_COLOR — any 6-digit hex e.g. "#e4002b"
#    REVALIDATE_SECRET — any 16+ char string e.g. "dev-secret-12345678"

# 4. Start dev server
npm run dev
```

The app fails fast on startup if required env vars are missing — the Zod schema in `src/lib/env.ts` throws a clear error listing what's wrong.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build (runs typecheck + lint as part of build) |
| `npm start` | Production server (requires a prior `npm run build`) |
| `npm run typecheck` | TypeScript check — run before every commit |
| `npm run test:run` | All tests once — fastest pre-commit check |
| `npm test` | Tests in watch mode during development |
| `npm run test:coverage` | Coverage report — output in `coverage/` |
| `npm run lint` | ESLint — checks all `.ts` and `.tsx` files |
| `npm run lint:fix` | ESLint with auto-fix |
| `npm run format` | Prettier format all files |
| `npm run format:check` | Check formatting (used in CI) |

## Testing Strategy

**What we test:** Domain models, mappers, utility functions, and application use cases. These are pure functions with no framework dependencies and give the highest confidence per test.

**What we don't test:** UI components (visual correctness is verified by running the app), route files (thin wiring), repository functions (network calls — verify manually against a real WP instance).

**Test file locations:**
```
src/utils/checks.test.ts                              ← type guards
src/domain/seo/metadata.utils.test.ts                 ← metadata generation
src/persistence/wordpress/mappers/postMapper.test.ts  ← WP mapper (most complex)
src/persistence/wordpress/mappers/categoryMapper.test.ts
src/persistence/wordpress/mappers/commentMapper.test.ts
src/application/blog/getHomepageData.test.ts          ← use case (mocked repos)
```

**Running a specific test file:**
```bash
npx vitest run src/persistence/wordpress/mappers/postMapper.test.ts
```

**Mock strategy:** Use `vi.mock()` at the module level for true external boundaries (repository functions in use-case tests). Never mock the persistence layer when testing mappers — mappers are pure functions that don't need mocks.

## Next.js 16 Gotchas

### `params` and `searchParams` are Promises

In Next.js 15+, route props are Promises. Always `await` before destructuring:

```typescript
// ✅ Correct
export default async function PostPage({ params }: Props) {
  const { slug } = await params
  ...
}

// ❌ Wrong — TypeScript error + runtime bug
export default async function PostPage({ params }: Props) {
  const { slug } = params  // params is Promise<{ slug: string }>
  ...
}
```

This applies to both `params` and `searchParams` in page components.

### `revalidateTag` requires 2 arguments

Next.js 16 changed `revalidateTag` to require a cache lifecycle profile as the second argument:

```typescript
// ✅ Correct in Next.js 16
revalidateTag('posts', { expire: 3600 })
revalidateTag(`post-${slug}`, { expire: 3600 })

// ❌ TypeScript error in Next.js 16
revalidateTag('posts')
```

Use `{ expire: serverEnv.REVALIDATE_POSTS }` in most cases to match the fetch TTL.

### Tailwind v4 — CSS-first, no config file

This project uses Tailwind v4 which is configured entirely in `src/app/globals.css` (no `tailwind.config.ts`). The `eslint-plugin-tailwindcss` can't resolve the config and emits warnings about custom classes like `text-brand-primary` — these are expected and harmless. The warnings are pre-existing and not introduced by new code.

---

## Where to Add Things

### New WP data type (e.g. WP Events)

1. `src/persistence/wordpress/types/wpEvent.dto.ts` — DTO mirroring WP REST response
2. `src/domain/event/event.model.ts` — clean domain model
3. `src/persistence/wordpress/mappers/eventMapper.ts` + `eventMapper.test.ts`
4. `src/persistence/wordpress/repositories/eventRepository.ts`
5. `src/application/blog/getEventsList.ts` (if needed)
6. `src/app/events/page.tsx` (if a route is needed)

### New UI component

1. Create in `src/components/{category}/ComponentName.tsx`
2. Use shadcn primitives from `src/components/ui/` — don't edit `ui/` files
3. For Badge/BreadcrumbLink: use `render={<Link href="..." />}` (not `asChild`)
4. Server Components by default; add `'use client'` only when hooks or event handlers are needed

### New route

1. Create `src/app/{path}/page.tsx`
2. Add `export const revalidate = N` (1800 for frequently updated, 3600 for posts, 86400 for static)
3. Call use cases from `src/application/` — never call repositories directly (except `generateStaticParams`)
4. Export `generateMetadata` using helpers from `src/domain/seo/metadata.utils.ts`
5. Call `notFound()` when the use case returns `null`

---

## Environment Access Rules

**Never** read `process.env` directly in feature code:

```typescript
// ❌ Wrong
const apiUrl = process.env.WORDPRESS_API_URL

// ✅ Correct
import { serverEnv } from '@/lib/env'
const apiUrl = serverEnv.WORDPRESS_API_URL
```

The Zod schema in `src/lib/env.ts` validates all vars at startup and provides TypeScript types. `serverEnv` is for server-only vars; `clientEnv` is for `NEXT_PUBLIC_` vars.

---

## Logging

Never use `console.log` in application code. Use the structured logger:

```typescript
import { logger } from '@/utils/logger'

logger.error('Something broke', { postId, error: err.message })
logger.warn('WP returned unexpected shape', { endpoint, field })
logger.info('Cache revalidated', { tag, slug })
logger.debug('Mapper output', { post })
```

The logger is silenced in `test` environment (no noise in test output). In production it emits structured JSON, ready for Datadog/Logtail/CloudWatch.

---

## Pre-Commit Checklist

```bash
npm run typecheck   # zero errors
npm run test:run    # all tests pass
npm run lint        # zero errors (warnings about Tailwind custom classes are OK)
```

Architecture boundary check:
- No `import` from `@/persistence/` in any component or route body
- No `process.env` outside `src/lib/env.ts`
- No `console.log` in any `.ts`/`.tsx` file
