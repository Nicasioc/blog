# Soccer Blog Platform

A white-label Next.js 16 blog that pulls content from a WordPress REST API. One codebase deploys once per soccer team, each with its own environment variables for branding, WordPress instance, and AdSense account.

## Tech Stack

| Area | Choice |
|------|--------|
| Framework | Next.js 16.2.6 (App Router, TypeScript) |
| UI | shadcn (New York style) + Tailwind v4 + Base UI |
| Data | WordPress REST API via `fetch` with ISR |
| Ads | AdSense (pluggable — Prebid stub included) |
| Testing | Vitest + React Testing Library |
| Deployment | Vercel (one project per team) |

## Quick Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local — fill in your WordPress URL, site name, colors, etc.

# 3. Start dev server
npm run dev
```

The app starts at `http://localhost:3000`. It will error on startup if any required env vars are missing — the Zod schema in `src/lib/env.ts` validates everything at boot time.

## Scripts

| Script | What it does |
|--------|-------------|
| `npm run dev` | Start dev server (hot reload) |
| `npm run build` | Production build |
| `npm start` | Start production server (after build) |
| `npm run typecheck` | TypeScript type check (no emit) |
| `npm run test:run` | Run all tests once |
| `npm test` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | ESLint check |
| `npm run lint:fix` | ESLint auto-fix |
| `npm run format` | Prettier format all files |
| `npm run format:check` | Check formatting without writing |

## Documentation

| Guide | What it covers |
|-------|---------------|
| [Architecture](docs/architecture.md) | Layered architecture, dependency rules, file patterns |
| [White-Label Deployment](docs/white-label-deployment.md) | Setting up new team sites on Vercel |
| [WordPress Integration](docs/wordpress-integration.md) | WP REST API, ISR webhook, WP config |
| [Ad System](docs/ad-system.md) | AdSense setup, provider abstraction, Prebid migration |
| [Development Guide](docs/development.md) | Day-to-day dev workflow, testing, gotchas |

## Project Structure

```
src/
├── app/                    # Next.js routes, layouts, API handlers
├── application/            # Use cases — orchestrate persistence + domain
├── components/
│   ├── ads/                # Ad abstraction layer
│   ├── layout/             # Header, Footer, Sidebar, SiteLogo
│   ├── navigation/         # Breadcrumb, Pagination, TagList
│   ├── post/               # PostCard, PostBody, CommentForm, etc.
│   ├── seo/                # JSON-LD Server Components
│   └── ui/                 # shadcn auto-generated — DO NOT edit
├── domain/                 # Pure TypeScript models — no framework deps
├── lib/                    # Env validation, siteConfig, cn() helper
├── persistence/            # WordPress REST API client, DTOs, mappers, repos
├── services/               # Ad config (placement types + slot IDs)
└── utils/                  # Shared type guards, structured logger
```

## White-Label in One Line

Set `NEXT_PUBLIC_SITE_NAME`, `NEXT_PUBLIC_PRIMARY_COLOR`, `NEXT_PUBLIC_SECONDARY_COLOR`, `WORDPRESS_API_URL`, and `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID` — everything else inherits from there. See [White-Label Deployment](docs/white-label-deployment.md).
