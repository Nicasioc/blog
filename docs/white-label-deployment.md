# White-Label Deployment

One GitHub repo, one Vercel project per team. Each project has its own env vars — no code changes between deployments.

## Environment Variables Reference

### Server-only (never exposed to browser)

| Variable                    | Required        | Purpose                                                                                                                             | Example                               |
| --------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `WORDPRESS_API_URL`         | ✅              | WordPress REST API base URL                                                                                                         | `https://realmadrid.com/wp-json`      |
| `WORDPRESS_CATEGORY_ID`     | optional        | Scope all post feeds to a single WP category ID                                                                                     | `5`                                   |
| `WORDPRESS_TAG_ID`          | optional        | Scope all post feeds to a single WP tag ID                                                                                          | `7`                                   |
| `PAYLOAD_API_URL`           | ✅              | Payload CMS REST API base URL (must end in `/api`)                                                                                  | `https://admin.vex-agency.com/api`    |
| `PAYLOAD_TENANT_SLUG`       | ✅              | Tenant slug used to scope all Payload reads/writes                                                                                  | `realmadrid`                          |
| `PAYLOAD_API_KEY`           | ✅              | Per-tenant API key — required even for reads, since resolving `PAYLOAD_TENANT_SLUG` to an id hits the non-public Tenants collection | `pk_live_...`                         |
| `REVALIDATE_POSTS`          | default: 3600   | ISR TTL for posts (seconds)                                                                                                         | `3600`                                |
| `REVALIDATE_PAGES`          | default: 86400  | ISR TTL for WP pages (seconds)                                                                                                      | `86400`                               |
| `REVALIDATE_SECRET`         | ✅ min 16 chars | Authenticates the ISR webhook                                                                                                       | `my-super-secret-key-32chars`         |
| `SITE_FAVICON_URL`          | optional        | Browser tab favicon path                                                                                                            | `/debate-cuervo/favicon.ico`          |
| `SITE_APPLE_TOUCH_ICON_URL` | optional        | iOS home screen icon path                                                                                                           | `/debate-cuervo/apple-touch-icon.png` |
| `SITE_ICON_192_URL`         | optional        | PWA manifest icon 192×192                                                                                                           | `/debate-cuervo/favicon-192.png`      |
| `SITE_ICON_512_URL`         | optional        | PWA manifest icon 512×512                                                                                                           | `/debate-cuervo/favicon-512.png`      |

All four favicon vars fall back to `/favicon.ico` when unset.

### Client-safe (NEXT*PUBLIC* prefix)

| Variable                              | Required           | Purpose                                  | Example                               |
| ------------------------------------- | ------------------ | ---------------------------------------- | ------------------------------------- |
| `NEXT_PUBLIC_SITE_NAME`               | ✅                 | Display name                             | `Real Madrid News`                    |
| `NEXT_PUBLIC_SITE_URL`                | ✅                 | Canonical base URL                       | `https://realmadrid-news.com`         |
| `NEXT_PUBLIC_SITE_LOGO_URL`           | ✅                 | Logo image URL                           | `https://cdn.example.com/rm-logo.svg` |
| `NEXT_PUBLIC_PRIMARY_COLOR`           | ✅ hex             | Team primary color                       | `#FFFFFF`                             |
| `NEXT_PUBLIC_SECONDARY_COLOR`         | ✅ hex             | Team secondary color                     | `#FFD700`                             |
| `NEXT_PUBLIC_PRIMARY_FOREGROUND`      | default: `#ffffff` | Text on primary bg                       | `#000000`                             |
| `NEXT_PUBLIC_AD_PROVIDER`             | default: `adsense` | Ad provider (`adsense`\|`gam`\|`prebid`) | `adsense`                             |
| `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID`    | optional           | AdSense publisher ID                     | `ca-pub-1234567890`                   |
| `NEXT_PUBLIC_ADSENSE_SLOT_HEADER`     | optional           | Slot ID for header leaderboard           | `1234567890`                          |
| `NEXT_PUBLIC_ADSENSE_SLOT_IN_CONTENT` | optional           | Slot ID for in-content ad                | `0987654321`                          |
| `NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR`    | optional           | Slot ID for sidebar                      | `1122334455`                          |
| `NEXT_PUBLIC_ADSENSE_SLOT_FOOTER`     | optional           | Slot ID for footer                       | `5544332211`                          |

**Hex color note:** In `.env` files, unquoted `#` is treated as a comment. Always quote hex values:

```
NEXT_PUBLIC_PRIMARY_COLOR="#FFFFFF"   # ✅
NEXT_PUBLIC_PRIMARY_COLOR=#FFFFFF     # ❌ — silently becomes empty string
```

---

## How Theming Works

```
.env.local
  NEXT_PUBLIC_PRIMARY_COLOR="#13294b"
       │
       ▼
src/lib/env.client.ts  (Zod validates hex format — must be "#RRGGBB")
       │
       ▼
src/lib/siteConfig.ts  (assembles SiteConfig singleton at module load)
       │
       ▼
src/app/layout.tsx  (Server Component — server-renders a <style> tag into <head>)
  <style>:root { --brand-primary: #13294b; --brand-secondary: ...; ... }</style>
       │
       ▼
src/app/globals.css :root
  --primary: var(--brand-primary)          ← shadcn's primary token now follows the brand
  --primary-foreground: var(--brand-primary-foreground)
       │
       ▼
src/app/globals.css @theme inline
  --color-primary: var(--primary)          ← Tailwind v4 utility mapping
       │
       ▼
Tailwind utilities: bg-primary, text-primary, ring-primary, hover:bg-primary, etc.
```

Because `--primary` is mapped to `var(--brand-primary)` in `globals.css`, all shadcn
components that use `bg-primary` or `text-primary` (Button default, Badge default, focus
rings, etc.) automatically inherit the tenant's brand color — no per-component changes needed.

The `<style>` tag is **server-rendered**: hex values are baked into HTML at request time,
not injected by client-side JavaScript.

### What each color drives

| Variable             | UI elements                                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| `PRIMARY_COLOR`      | Header bg, footer bg, primary buttons, default badges, post body headings, sidebar badge hover |
| `SECONDARY_COLOR`    | Header bottom border, "Featured" accent bar, post body links, nav link hover                   |
| `PRIMARY_FOREGROUND` | All text rendered on top of primary-colored surfaces (header nav, footer copyright)            |

### Adding a third brand color

Follow the same chain:

1. Add env var in `env.client.ts` (Zod, hex regex)
2. Add to `siteConfig.theme`
3. Inject in the `layout.tsx` `<style>` tag as `--brand-tertiary: ${value}`
4. Map in `globals.css` `@theme inline`: `--color-brand-tertiary: var(--brand-tertiary)`
5. Use in components as `text-brand-tertiary`, `bg-brand-tertiary`, etc.

---

## Tenant Asset Folder Convention

Place all brand assets for a tenant under `public/<tenant-slug>/`:

```
public/
  debate-cuervo/
    favicon.ico
    apple-touch-icon.png
    favicon-192.png
    favicon-512.png
    logo-main.svg
```

Point the env vars to relative paths (e.g. `/debate-cuervo/favicon.ico`). No code changes are needed when onboarding a new tenant — add the folder and set the env vars.

Logos render in their natural colors. Provide a logo variant that is legible on the dark primary header background (e.g. a light or white version, or a full-color badge).

---

## Launching a New Team Site

1. **Go to Vercel** → Add New Project → Import from GitHub (same repo)
2. **Add tenant assets** under `public/<tenant-slug>/` and commit them
3. **Set environment variables** in the Vercel project settings (copy from `.env.example`, fill in team values)
4. **Add WP image domain** to `next.config.ts` → `images.remotePatterns`:
   ```typescript
   { protocol: 'https', hostname: 'media.yourwp.com' }
   ```
   Commit this change — `next/image` will 500 on images from unlisted domains.
5. **Assign a custom domain** in Vercel project settings — done

---

## next.config.ts — remotePatterns

The current config allows `**.wordpress.com`. For self-hosted WordPress, add the media server hostname:

```typescript
images: {
  remotePatterns: [
    { protocol: 'https', hostname: '**.wordpress.com' },
    { protocol: 'https', hostname: 'media.yourclub.com' },  // add per deployment
  ],
}
```

If images are served from a different subdomain than the WP install (common with object storage CDNs), add that hostname too.

---

## Vercel Plan

**Hobby plan prohibits commercial use.** Since the goal is ad revenue, use **Vercel Pro ($20/month)** for any site running live ads. Use Hobby for development and staging.

ISR works out of the box on Vercel — `revalidate` constants map to Edge Cache TTLs. On-demand revalidation via `revalidateTag()` (triggered from the WordPress webhook) is supported on all paid plans.

---

## Post Scoping (Shared WordPress Instance)

When two or more tenants share the same `WORDPRESS_API_URL`, set one of the scoping vars to
restrict this site to only its own content:

```
WORDPRESS_CATEGORY_ID=5   # show only posts in WP category ID 5
# — or —
WORDPRESS_TAG_ID=7        # show only posts tagged with WP tag ID 7
```

Both are optional and independent. If neither is set, all published posts are returned (the
default behaviour when each tenant has its own WordPress instance).

**Prefer `WORDPRESS_TAG_ID` for multi-tenant setups.** WordPress ANDs different taxonomy
params (`?tags=SCOPE&categories=BROWSE`), so tag-based scoping combines correctly with
category-archive pages. Category-based scoping uses a single `categories` param and the
archive category replaces the scope in those pages — posts outside the tenant scope may
appear. See the WordPress Integration doc for the full technical explanation.

**What is affected:**

| Page / feature                                | Scoped?                                              |
| --------------------------------------------- | ---------------------------------------------------- |
| Homepage post feed                            | ✅                                                   |
| Paginated post archive                        | ✅                                                   |
| Static slug generation (sitemap / pre-render) | ✅                                                   |
| Category archive                              | tag-scope ✅ / category-scope ⚠️                     |
| Tag archive                                   | ✅ (tag-scope only affects pages not archive itself) |
| Single post page                              | — (fetched by slug, no scope needed)                 |
| Related posts                                 | — (derived from the post's own categories)           |

---

## Multiple Teams — Isolation

Each Vercel project is fully isolated:

- Own env vars (different WP instance, different colors, different AdSense account)
- Own domain
- Own Edge Cache
- Shared codebase from the same GitHub repo

A `git push` to `main` triggers a new deployment across all Vercel projects that track that branch.
