# Phase 1: Scaffold & Configure

## Context

Detailed execution plan for Phase 1 of the Soccer Blog Platform. Goal: go from an empty repo to a running Next.js app with the full configuration foundation in place — framework, styling, environment validation, white-label site config, linting, and testing. Every subsequent phase builds on top of what Phase 1 produces.

**Versions locked:**

- Next.js: 16.2.6 (latest stable)
- Tailwind CSS: 4.3.0 (v4, CSS-first — no `tailwind.config.ts`)
- shadcn: 4.7.0
- Zod: 4.4.3

---

## Step 1 — Scaffold Next.js

```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --eslint \
  --use-npm \
  --yes
```

**What this creates:**

- `src/app/` — App Router root with `layout.tsx`, `page.tsx`, `globals.css`
- `next.config.ts` — minimal config
- `tsconfig.json` — `@/*` → `./src/*` path alias
- `eslint.config.mjs`, `postcss.config.mjs`
- `package.json` with Next.js 16, React 19, Tailwind v4

**Clean up boilerplate after scaffold:**

- Clear `src/app/page.tsx` to a minimal placeholder
- Strip default styles from `globals.css` (keep only `@import "tailwindcss"`)
- Delete placeholder SVGs from `public/`

---

## Step 2 — Initialize shadcn

```bash
npx shadcn@latest init
```

**Answer the prompts as follows:**

| Prompt        | Answer       |
| ------------- | ------------ |
| Style         | **New York** |
| Base color    | **Neutral**  |
| CSS variables | **Yes**      |

**What this does:**

- Creates `src/components/ui/`
- Creates `src/lib/utils.ts` with `cn()` helper (clsx + tailwind-merge)
- Adds shadcn CSS variable theme to `globals.css`
- Installs `clsx`, `tailwind-merge`, `class-variance-authority`, `lucide-react`, `@radix-ui/*`
- Creates `components.json`

Do **not** create a separate `cn.ts` — use `src/lib/utils.ts` that shadcn generates.

---

## Step 3 — Install Additional Dependencies

```bash
# Runtime
npm install zod @tailwindcss/typography@next

# Linting
npm install -D prettier eslint-config-prettier eslint-plugin-tailwindcss

# Testing
npm install -D vitest @vitejs/plugin-react jsdom \
  @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

| Package                               | Purpose                                                       |
| ------------------------------------- | ------------------------------------------------------------- |
| `zod`                                 | Env + config validation                                       |
| `@tailwindcss/typography@next`        | `@next` tag required for Tailwind v4 compat                   |
| `prettier` + `eslint-config-prettier` | Formatting; prettier config disables conflicting ESLint rules |
| `eslint-plugin-tailwindcss`           | Validates Tailwind class names                                |
| `vitest`                              | Test runner — faster than Jest, native TS                     |
| `@vitejs/plugin-react`                | JSX support for Vitest component tests                        |
| `jsdom`                               | Simulated browser DOM                                         |
| `@testing-library/react`              | Component rendering + querying                                |
| `@testing-library/jest-dom`           | DOM matchers (`.toBeVisible()`, `.toHaveTextContent()`)       |
| `@testing-library/user-event`         | Simulates clicks, typing, etc.                                |

---

## Step 4 — Install shadcn Components

```bash
npx shadcn@latest add button card badge avatar separator skeleton
npx shadcn@latest add breadcrumb pagination
npx shadcn@latest add navigation-menu sheet
```

All land in `src/components/ui/`. **Never edit these files directly** — wrap them in components under `src/components/layout/` or `src/components/post/`.

---

## Step 5 — Create `src/lib/env.ts`

The only place in the codebase that reads `process.env`. Everything is Zod-validated at startup.

```typescript
import { z } from 'zod'

const serverSchema = z.object({
  WORDPRESS_API_URL: z.string().url(),
  REVALIDATE_POSTS: z.coerce.number().default(3600),
  REVALIDATE_PAGES: z.coerce.number().default(86400),
})

const clientSchema = z.object({
  NEXT_PUBLIC_SITE_NAME: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXT_PUBLIC_SITE_LOGO_URL: z.string().min(1),
  NEXT_PUBLIC_PRIMARY_COLOR: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  NEXT_PUBLIC_SECONDARY_COLOR: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  NEXT_PUBLIC_PRIMARY_FOREGROUND: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default('#ffffff'),
  NEXT_PUBLIC_AD_PROVIDER: z.enum(['adsense', 'gam', 'prebid']).default('adsense'),
  NEXT_PUBLIC_ADSENSE_PUBLISHER_ID: z.string().startsWith('ca-pub-').optional(),
})

const _serverEnv = serverSchema.safeParse(process.env)
const _clientEnv = clientSchema.safeParse(process.env)

if (!_serverEnv.success) {
  throw new Error(`Server env validation failed:\n${_serverEnv.error.toString()}`)
}
if (!_clientEnv.success) {
  throw new Error(`Client env validation failed:\n${_clientEnv.error.toString()}`)
}

export const serverEnv = _serverEnv.data
export const clientEnv = _clientEnv.data
```

**Rule:** Only `clientEnv` is safe in Client Components. Importing `serverEnv` in a client bundle = build crash.

---

## Step 6 — Create `src/lib/siteConfig.ts`

White-label config assembled from `clientEnv`. Layout and components import this — never env directly.

```typescript
import { clientEnv } from '@/lib/env'

export type SiteConfig = {
  siteName: string
  siteUrl: string
  logoUrl: string
  theme: {
    primary: string
    secondary: string
    primaryForeground: string
  }
  adProvider: 'adsense' | 'gam' | 'prebid'
  adSensePublisherId: string | undefined
}

export const siteConfig: SiteConfig = {
  siteName: clientEnv.NEXT_PUBLIC_SITE_NAME,
  siteUrl: clientEnv.NEXT_PUBLIC_SITE_URL,
  logoUrl: clientEnv.NEXT_PUBLIC_SITE_LOGO_URL,
  theme: {
    primary: clientEnv.NEXT_PUBLIC_PRIMARY_COLOR,
    secondary: clientEnv.NEXT_PUBLIC_SECONDARY_COLOR,
    primaryForeground: clientEnv.NEXT_PUBLIC_PRIMARY_FOREGROUND,
  },
  adProvider: clientEnv.NEXT_PUBLIC_AD_PROVIDER,
  adSensePublisherId: clientEnv.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID,
}
```

---

## Step 7 — Update `next.config.ts`

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.wordpress.com',
      },
      // Add your specific WP domain, e.g.:
      // { protocol: 'https', hostname: 'your-wp-site.com' }
    ],
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}

export default nextConfig
```

"Invalid src prop" 500 errors mean the WP hostname is missing from `remotePatterns`.

---

## Step 8 — Update `src/app/globals.css`

After shadcn init, prepend these at the top of the file (before shadcn's `@layer base` block):

```css
@import 'tailwindcss';
@plugin "@tailwindcss/typography";

@theme {
  /* Reference CSS variables that get overridden per-team in layout.tsx */
  --color-brand-primary: var(--brand-primary);
  --color-brand-secondary: var(--brand-secondary);
  --color-brand-primary-foreground: var(--brand-primary-foreground);
}

/* shadcn's existing @layer base block follows — do not edit it */
```

Classes `bg-brand-primary`, `text-brand-secondary` etc. resolve to the team CSS variables set in the root layout.

---

## Step 9 — Update `src/app/layout.tsx`

```typescript
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { siteConfig } from '@/lib/siteConfig'
import './globals.css'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: {
    default: siteConfig.siteName,
    template: `%s | ${siteConfig.siteName}`,
  },
  metadataBase: new URL(siteConfig.siteUrl),
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        <style>{`
          :root {
            --brand-primary: ${siteConfig.theme.primary};
            --brand-secondary: ${siteConfig.theme.secondary};
            --brand-primary-foreground: ${siteConfig.theme.primaryForeground};
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}
```

Server Component — CSS variable values are rendered into the HTML at build/request time. No color flash.

---

## Step 10 — Create `.env.example`

Committed to git. Documents every variable with placeholder values.

```bash
# ============================================================
# Soccer Blog Platform — Environment Variables
# Copy this file to .env.local and fill in your values.
# ============================================================

# Server-only
WORDPRESS_API_URL=https://your-wordpress-site.com/wp-json
REVALIDATE_POSTS=3600
REVALIDATE_PAGES=86400

# White-label / per-team (NEXT_PUBLIC_ = browser-safe)
NEXT_PUBLIC_SITE_NAME=Team Name News
NEXT_PUBLIC_SITE_URL=https://your-blog-domain.com
NEXT_PUBLIC_SITE_LOGO_URL=https://cdn.example.com/logo.svg
NEXT_PUBLIC_PRIMARY_COLOR=#1a1a2e
NEXT_PUBLIC_SECONDARY_COLOR=#e94560
NEXT_PUBLIC_PRIMARY_FOREGROUND=#ffffff

# Ads
NEXT_PUBLIC_AD_PROVIDER=adsense
NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=ca-pub-XXXXXXXXXXXXXXXX
```

---

## Step 11 — Create `.env.local`

Gitignored. Real dev values. Short revalidation times for fast iteration.

```bash
WORDPRESS_API_URL=https://your-actual-wp-site.com/wp-json
REVALIDATE_POSTS=60
REVALIDATE_PAGES=300

NEXT_PUBLIC_SITE_NAME=Dev Blog
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_LOGO_URL=/logo-placeholder.svg
NEXT_PUBLIC_PRIMARY_COLOR=#1a1a2e
NEXT_PUBLIC_SECONDARY_COLOR=#e94560
NEXT_PUBLIC_PRIMARY_FOREGROUND=#ffffff
NEXT_PUBLIC_AD_PROVIDER=adsense
NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=ca-pub-XXXXXXXXXXXXXXXX
```

---

## Step 12 — Configure Prettier

**`.prettierrc`:**

```json
{
  "singleQuote": true,
  "semi": false,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

**`.prettierignore`:**

```
.next
node_modules
public
```

---

## Step 13 — Update `eslint.config.mjs`

```javascript
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'
import tailwindPlugin from 'eslint-plugin-tailwindcss'
import prettierConfig from 'eslint-config-prettier'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const compat = new FlatCompat({ baseDirectory: __dirname })

export default [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    plugins: { tailwindcss: tailwindPlugin },
    rules: {
      ...tailwindPlugin.configs.recommended.rules,
      'tailwindcss/no-custom-classname': 'warn', // warn not error — false positives with v4 @theme tokens
    },
  },
  prettierConfig, // must be last
]
```

---

## Step 14 — Configure Vitest

**`vitest.config.ts`:**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    globals: true,
    exclude: ['**/node_modules/**'],
    coverage: {
      provider: 'v8',
      include: ['src/domain/**', 'src/utils/**', 'src/application/**'],
      exclude: ['src/components/ui/**'],
    },
  },
  resolve: {
    alias: { '@': resolve(__dirname, './src') },
  },
})
```

`@` alias must mirror `tsconfig.json` paths or test imports will fail.

---

## Step 15 — Create `src/tests/setup.ts`

```typescript
import '@testing-library/jest-dom'
```

Update `tsconfig.json` `compilerOptions`:

```json
{
  "compilerOptions": {
    "types": ["@testing-library/jest-dom"]
  }
}
```

---

## Step 16 — Update `package.json` Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "typecheck": "tsc --noEmit"
  }
}
```

`test` = watch mode (TDD). `test:run` = run once and exit (CI).

---

## Step 17 — Update `src/app/page.tsx`

Minimal placeholder to verify the full config chain end-to-end:

```typescript
import { siteConfig } from '@/lib/siteConfig'

export default function HomePage() {
  return (
    <main className="container mx-auto p-8">
      <h1 className="text-4xl font-bold text-brand-primary">
        {siteConfig.siteName}
      </h1>
      <p className="mt-2 text-muted-foreground">Phase 1 complete — scaffold is ready.</p>
    </main>
  )
}
```

---

## File Tree After Phase 1

```
blog/
├── CLAUDE.md
├── plan/
│   ├── PLAN.md
│   ├── phase-1.md       ← this file
│   └── phase-2.md       ← next
├── .env.example
├── .env.local           ← gitignored
├── .prettierrc
├── .prettierignore
├── components.json
├── next.config.ts
├── vitest.config.ts
├── package.json
├── tsconfig.json
├── eslint.config.mjs
├── postcss.config.mjs
└── src/
    ├── app/
    │   ├── globals.css  ← Tailwind v4 + shadcn vars + typography + brand tokens
    │   ├── layout.tsx   ← font + metadata + brand CSS var injection
    │   └── page.tsx     ← minimal placeholder
    ├── tests/
    │   └── setup.ts     ← @testing-library/jest-dom
    ├── components/
    │   └── ui/          ← shadcn components (never edit)
    └── lib/
        ├── env.ts       ← Zod-validated env (server + client split)
        ├── siteConfig.ts ← white-label config assembled from env
        └── utils.ts     ← cn() helper (shadcn generated)
```

---

## Verification Checklist

1. `npm run dev` — starts with no terminal errors
2. `http://localhost:3000` — page renders, site name in correct brand color
3. Browser devtools `:root` — `--brand-primary` and `--brand-secondary` set to `.env.local` hex values
4. Change `NEXT_PUBLIC_PRIMARY_COLOR` in `.env.local`, restart — heading color updates
5. `npm run typecheck` — zero type errors
6. `npm run lint` — zero errors (tailwindcss warnings OK)
7. `npm run format:check` — no formatting issues
8. `npm run test:run` — runner starts without config errors
9. `npm run build` — production build succeeds

---

## Definition of Done

All 9 checklist items pass, and:

- No `process.env` reads outside `src/lib/env.ts`
- `src/components/ui/` has all shadcn components from Step 4
- `vitest.config.ts`, `.prettierrc`, `eslint.config.mjs` committed
- `src/tests/setup.ts` imports `@testing-library/jest-dom`

---

## Key Gotchas

| Area                           | Issue                                               | Fix                                                        |
| ------------------------------ | --------------------------------------------------- | ---------------------------------------------------------- |
| Tailwind v4                    | No `tailwind.config.ts`                             | Use `@plugin` and `@theme` in CSS                          |
| Typography plugin              | `@latest` (0.5.19) is Tailwind v3 only              | Use `@tailwindcss/typography@next`                         |
| shadcn + Tailwind v4           | `init` writes different `globals.css` structure     | Let shadcn write it, then prepend brand vars               |
| eslint-plugin-tailwindcss + v4 | No config file → false positives on `@theme` tokens | Set `no-custom-classname` to `warn`                        |
| ESLint flat config             | Legacy `extends` needs wrapper                      | Use `FlatCompat` for `next/core-web-vitals`                |
| Prettier vs ESLint             | Formatting rule conflicts                           | `eslint-config-prettier` must be last                      |
| Vitest `@` alias               | `@/lib/env` fails in tests                          | Mirror `tsconfig.json` paths in `vitest.config.ts`         |
| Vitest globals                 | `describe`/`expect` undefined                       | Set `globals: true` in `vitest.config.ts`                  |
| jest-dom types                 | `toBeInTheDocument` TS errors                       | Add `"@testing-library/jest-dom"` to `tsconfig.json` types |
| `serverEnv` in tests           | Throws on missing env vars                          | Set test env vars in vitest config `env` option            |
| `serverEnv` in client          | Build crash                                         | Only import `clientEnv` in Client Components               |
| next/image external logo       | 500 on unknown hostname                             | Add CDN hostname to `next.config.ts` remotePatterns        |
