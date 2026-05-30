# White-Label Deployment

One GitHub repo, one Vercel project per team. Each project has its own env vars — no code changes between deployments.

## Environment Variables Reference

### Server-only (never exposed to browser)

| Variable | Required | Purpose | Example |
|----------|----------|---------|---------|
| `WORDPRESS_API_URL` | ✅ | WordPress REST API base URL | `https://realmadrid.com/wp-json` |
| `REVALIDATE_POSTS` | default: 3600 | ISR TTL for posts (seconds) | `3600` |
| `REVALIDATE_PAGES` | default: 86400 | ISR TTL for WP pages (seconds) | `86400` |
| `REVALIDATE_SECRET` | ✅ min 16 chars | Authenticates the ISR webhook | `my-super-secret-key-32chars` |

### Client-safe (NEXT_PUBLIC_ prefix)

| Variable | Required | Purpose | Example |
|----------|----------|---------|---------|
| `NEXT_PUBLIC_SITE_NAME` | ✅ | Display name | `Real Madrid News` |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Canonical base URL | `https://realmadrid-news.com` |
| `NEXT_PUBLIC_SITE_LOGO_URL` | ✅ | Logo image URL | `https://cdn.example.com/rm-logo.svg` |
| `NEXT_PUBLIC_PRIMARY_COLOR` | ✅ hex | Team primary color | `#FFFFFF` |
| `NEXT_PUBLIC_SECONDARY_COLOR` | ✅ hex | Team secondary color | `#FFD700` |
| `NEXT_PUBLIC_PRIMARY_FOREGROUND` | default: `#ffffff` | Text on primary bg | `#000000` |
| `NEXT_PUBLIC_AD_PROVIDER` | default: `adsense` | Ad provider (`adsense`\|`gam`\|`prebid`) | `adsense` |
| `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID` | optional | AdSense publisher ID | `ca-pub-1234567890` |
| `NEXT_PUBLIC_ADSENSE_SLOT_HEADER` | optional | Slot ID for header leaderboard | `1234567890` |
| `NEXT_PUBLIC_ADSENSE_SLOT_IN_CONTENT` | optional | Slot ID for in-content ad | `0987654321` |
| `NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR` | optional | Slot ID for sidebar | `1122334455` |
| `NEXT_PUBLIC_ADSENSE_SLOT_FOOTER` | optional | Slot ID for footer | `5544332211` |

**Hex color note:** In `.env` files, unquoted `#` is treated as a comment. Always quote hex values:
```
NEXT_PUBLIC_PRIMARY_COLOR="#FFFFFF"   # ✅
NEXT_PUBLIC_PRIMARY_COLOR=#FFFFFF     # ❌ — silently becomes empty string
```

---

## How Theming Works

```
.env.local
  NEXT_PUBLIC_PRIMARY_COLOR="#FFFFFF"
       │
       ▼
src/lib/env.ts (Zod validates hex format)
       │
       ▼
src/lib/siteConfig.ts (assembles SiteConfig singleton)
       │
       ▼
src/app/layout.tsx (injects CSS custom properties)
  <style>:root { --brand-primary: #FFFFFF; ... }</style>
       │
       ▼
Tailwind classes: text-brand-primary, hover:text-brand-primary, etc.
shadcn --primary override: components pick up team colors automatically
```

All shadcn components that reference `--primary` and `--secondary` automatically use the team's colors because `layout.tsx` overrides those CSS variables at `:root`.

---

## Launching a New Team Site

1. **Go to Vercel** → Add New Project → Import from GitHub (same repo)
2. **Set environment variables** in the Vercel project settings (copy from `.env.example`, fill in team values)
3. **Add WP image domain** to `next.config.ts` → `images.remotePatterns`:
   ```typescript
   { protocol: 'https', hostname: 'media.yourwp.com' }
   ```
   Commit this change — `next/image` will 500 on images from unlisted domains.
4. **Assign a custom domain** in Vercel project settings — done

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

## Multiple Teams — Isolation

Each Vercel project is fully isolated:
- Own env vars (different WP instance, different colors, different AdSense account)
- Own domain
- Own Edge Cache
- Shared codebase from the same GitHub repo

A `git push` to `main` triggers a new deployment across all Vercel projects that track that branch.
