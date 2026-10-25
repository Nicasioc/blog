# White-Label Deployment

One GitHub repo, one Vercel project per team. Each project has its own env vars — no code changes between deployments.

## Environment Variables Reference

### Server-only (never exposed to browser)

| Variable                    | Required        | Purpose                                                                                                                                                              | Example                               |
| --------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `PAYLOAD_API_URL`           | ✅              | Payload CMS REST API base URL (must end in `/api`)                                                                                                                   | `https://admin.vex-agency.com/api`    |
| `PAYLOAD_TENANT_SLUG`       | ✅              | Tenant slug used to scope all Payload reads/writes                                                                                                                   | `realmadrid`                          |
| `PAYLOAD_API_KEY`           | ✅              | Per-tenant API key (read-only `service` role) — used only to resolve `PAYLOAD_TENANT_SLUG` to an id in the non-public Tenants collection; comment writes send no key | `pk_live_...`                         |
| `REVALIDATE_POSTS`          | default: 3600   | ISR TTL for posts (seconds)                                                                                                                                          | `3600`                                |
| `REVALIDATE_PAGES`          | default: 86400  | ISR TTL for CMS pages (seconds)                                                                                                                                      | `86400`                               |
| `REVALIDATE_SECRET`         | ✅ min 16 chars | Authenticates the ISR webhook                                                                                                                                        | `my-super-secret-key-32chars`         |
| `SITE_FAVICON_URL`          | optional        | Browser tab favicon path                                                                                                                                             | `/debate-cuervo/favicon.ico`          |
| `SITE_APPLE_TOUCH_ICON_URL` | optional        | iOS home screen icon path                                                                                                                                            | `/debate-cuervo/apple-touch-icon.png` |
| `SITE_ICON_192_URL`         | optional        | PWA manifest icon 192×192                                                                                                                                            | `/debate-cuervo/favicon-192.png`      |
| `SITE_ICON_512_URL`         | optional        | PWA manifest icon 512×512                                                                                                                                            | `/debate-cuervo/favicon-512.png`      |
| `ADS_TXT_EXTRA_LINES`       | optional        | Extra `/ads.txt` entries (GAM publisher line, demand partners), separated by `\|` or newlines; `#` lines ignored                                                     | `google.com, pub-…, DIRECT, f08c…`    |

All four favicon vars fall back to `/favicon.ico` when unset.

### Client-safe (NEXT*PUBLIC* prefix)

| Variable                                 | Required               | Purpose                                                                                                                                      | Example                               |
| ---------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `NEXT_PUBLIC_SITE_NAME`                  | ✅                     | Display name                                                                                                                                 | `Real Madrid News`                    |
| `NEXT_PUBLIC_SITE_URL`                   | ✅                     | Canonical base URL                                                                                                                           | `https://realmadrid-news.com`         |
| `NEXT_PUBLIC_SITE_LOGO_URL`              | ✅                     | Logo image URL                                                                                                                               | `https://cdn.example.com/rm-logo.svg` |
| `NEXT_PUBLIC_PRIMARY_COLOR`              | ✅ hex                 | Team primary color                                                                                                                           | `#FFFFFF`                             |
| `NEXT_PUBLIC_SECONDARY_COLOR`            | ✅ hex                 | Team secondary color                                                                                                                         | `#FFD700`                             |
| `NEXT_PUBLIC_PRIMARY_FOREGROUND`         | default: `#ffffff`     | Text on primary bg                                                                                                                           | `#000000`                             |
| `NEXT_PUBLIC_AD_PROVIDER`                | default: `adsense`     | Ad provider (`adsense`\|`gam`)                                                                                                               | `adsense`                             |
| `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID`       | optional               | AdSense publisher ID                                                                                                                         | `ca-pub-1234567890`                   |
| `NEXT_PUBLIC_ADSENSE_SLOT_HEADER`        | optional               | Slot ID for header leaderboard                                                                                                               | `1234567890`                          |
| `NEXT_PUBLIC_ADSENSE_SLOT_IN_CONTENT`    | optional               | Slot ID for in-content ad                                                                                                                    | `0987654321`                          |
| `NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR`       | optional               | Slot ID for sidebar                                                                                                                          | `1122334455`                          |
| `NEXT_PUBLIC_ADSENSE_SLOT_FOOTER`        | optional               | Slot ID for footer                                                                                                                           | `5544332211`                          |
| `NEXT_PUBLIC_ADSENSE_SLOT_MOBILE_BANNER` | optional               | Slot ID for mobile banner                                                                                                                    | `6677889900`                          |
| `NEXT_PUBLIC_ADSENSE_SLOT_IN_FEED`       | optional               | Slot ID for in-feed (post lists)                                                                                                             | `2233445566`                          |
| `NEXT_PUBLIC_ADSENSE_SLOT_BELOW_CONTENT` | optional               | Slot ID for below-content                                                                                                                    | `3344556677`                          |
| `NEXT_PUBLIC_GAM_NETWORK_CODE`           | when provider is `gam` | GAM network code                                                                                                                             | `21234567890`                         |
| `NEXT_PUBLIC_GAM_SLOT_*`                 | optional               | GAM ad unit code per placement (`HEADER`, `FOOTER`, `MOBILE_BANNER`, `IN_CONTENT`, `BELOW_CONTENT`, `SIDEBAR`, `IN_FEED`), not the full path | `debatecuervo_header`                 |
| `NEXT_PUBLIC_ADS_ENABLED`                | default: `true`        | Site-wide ads kill switch                                                                                                                    | `false`                               |

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
   - **`PAYLOAD_API_KEY`:** create the tenant's service-role key first — see [Creating the Tenant's Service Key](#creating-the-tenants-service-key).
   - **Ads:** follow [Setting Up Ads for a Tenant](ad-system.md#setting-up-ads-for-a-tenant) — which ad units to create (AdSense or GAM), the env var for each placement, the `ads.txt` lines, and how to verify.
4. **Assign a custom domain** in Vercel project settings — done

### Creating the Tenant's Service Key

`PAYLOAD_API_KEY` must belong to a user with the **`service`** role, scoped to this tenant only. A
service user is read-only and cannot sign in to the admin UI, so a leaked key can read this
tenant's data but change nothing. **Never use an `admin` or `editor` user's key** — the blog does not
need to write anything with it (comments are created without a key).

Only an `admin` can create users. In the CMS admin (`PAYLOAD_API_URL` without `/api`):

1. **Users → Create New**. Use a dedicated email, for example `<tenant-slug>@blog-cms.local`, and a
   long random password (nobody signs in with it).
2. **Roles:** select **Service** and nothing else.
3. **Tenants:** add this tenant only.
4. Turn on **Enable API Key**, then **Generate New API Key**, and copy the key before leaving the page.
5. **Save the user.** The key only takes effect once the user is saved.
6. In the tenant's Vercel project, set `PAYLOAD_API_KEY` for **Production and Preview** and
   redeploy. A changed variable only applies to new deployments; the running deployment keeps the old
   value until it is replaced.

Check the key before relying on it:

```bash
curl -s -H "Authorization: users API-Key <key>" "$PAYLOAD_API_URL/users/me"      # a user with roles ["service"]
curl -s -H "Authorization: users API-Key <key>" "$PAYLOAD_API_URL/tenants?where[slug][equals]=<tenant-slug>"
```

The second call must return exactly one doc whose `slug` is this tenant's. An empty `docs` array
means the key cannot see the tenant, and the blog's tenant lookup would fail at runtime.

`/users/me` returning `{"user": null}` means the key was not verified (the CMS verifies keys with its
own `PAYLOAD_SECRET`, so a key created against a different secret fails silently). Service users are
read-only, so any write with this key is rejected (401 or 403).

To rotate, generate a new key on the same user and update the Vercel variable. To move a tenant off an
old editor key, create the service user first, redeploy, smoke test, and only then revoke the old key:
until the new deployment is live, the old one still uses it.

No image-domain step: all media is served through the `/api/media/file/*` rewrite to
`PAYLOAD_API_URL` (see below), so `next/image` treats it as a local path — nothing to add
to `next.config.ts` per tenant.

---

## next.config.ts — media

Media is **not** loaded from a remote image host. `media.url` from the CMS is the proxy path
`/api/media/file/<name>` (Payload access control stays on there), and `next.config.ts`
rewrites `/api/media/file/*` on this domain through to the CMS origin derived from
`PAYLOAD_API_URL`:

```typescript
const cmsOrigin = new URL(process.env.PAYLOAD_API_URL ?? '…').origin

images: {
  // Only used if a media URL is ever absolute; the rewrite keeps the common case local.
  remotePatterns: [{ protocol: 'https', hostname: new URL(cmsOrigin).hostname }],
},
async rewrites() {
  return [{ source: '/api/media/file/:path*', destination: `${cmsOrigin}/api/media/file/:path*` }]
},
```

This is derived from `PAYLOAD_API_URL` alone — there is nothing to configure per tenant.

---

## Vercel Plan

**Hobby plan prohibits commercial use.** Since the goal is ad revenue, use **Vercel Pro ($20/month)** for any site running live ads. Use Hobby for development and staging.

ISR works out of the box on Vercel — `revalidate` constants map to Edge Cache TTLs. On-demand revalidation via `revalidateTag()` (triggered from the CMS revalidation webhook) is supported on all paid plans.

---

## Tenant Scoping (Shared Payload CMS)

Every tenant blog reads from the **same** Payload CMS at `PAYLOAD_API_URL`. What keeps this
deployment showing only its own team's content is `PAYLOAD_TENANT_SLUG` — there are no
optional per-taxonomy scoping vars to set. It is required, not optional.

```
PAYLOAD_TENANT_SLUG=realmadrid   # this deployment only ever sees the "realmadrid" tenant's content
```

How it works (full detail in `docs/payload-integration.md`):

```
serverEnv.PAYLOAD_TENANT_SLUG
  → resolveTenantId()          # GET /tenants?where[slug][equals]=… (authenticated with PAYLOAD_API_KEY)
  → payloadFetch adds where[tenant][equals]=<id> to every content request
```

This is not a taxonomy filter layered on top of a shared feed — it is applied to **every**
read (posts, pages, categories, tags, authors, comments), so there is no "AND vs OR"
interaction with archive pages to reason about. The
per-tenant `PAYLOAD_API_KEY` is required even though content reads are otherwise
unauthenticated, because resolving the slug to an id hits the non-public Tenants collection.
The key only needs read access (the `service` role); comment creation is sent without a key.

> Server-side enforcement of the `tenant` filter (so the CMS rejects a cross-tenant query
> rather than trusting the `where` clause the blog sends) is tracked in BLO-130. Today the
> scoping is applied client-side in `payloadClient.ts`.

**What is affected:**

| Page / feature                                | Scoped?                                                          |
| --------------------------------------------- | ---------------------------------------------------------------- |
| Homepage post feed                            | ✅                                                               |
| Paginated post archive                        | ✅                                                               |
| Static slug generation (sitemap / pre-render) | ✅                                                               |
| Category archive                              | ✅ (tenant filter + the archive's category filter)               |
| Tag archive                                   | ✅ (tenant filter + the archive's tag filter)                    |
| Single post / page                            | ✅ (slug lookup still carries the tenant filter)                 |
| Related posts                                 | ✅ (derived from the post's own categories, still tenant-scoped) |
| Comments                                      | ✅                                                               |

---

## Multiple Teams — Isolation

Each Vercel project is fully isolated:

- Own env vars (different tenant slug, different colors, different AdSense account)
- Own domain
- Own Edge Cache
- Shared codebase from the same GitHub repo

A `git push` to `main` triggers a new deployment across all Vercel projects that track that branch.
