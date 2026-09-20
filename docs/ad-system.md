# Ad System

The ad system is designed for **provider-agnostic placement**. Pages and components only use `<AdSlot placement="...">` — the underlying provider (AdSense, GAM, Prebid) is swapped via a single env var without touching any component.

## Architecture

```
<AdSlot placement="sidebar" />
    │  (Client Component)
    ▼
useAdProvider().renderSlot('sidebar')
    │  (React context from AdProvider)
    ▼
AdSenseSlot | PrebidSlot | null
    │  (active provider component)
    ▼
<ins class="adsbygoogle" ...>
```

### Key Files

| File                                               | Role                                                                                            |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `src/lib/siteConfig.ts`                            | Single read surface for ad config — `siteConfig.ads.{provider,adSensePublisherId,slots}`        |
| `src/services/ads/adConfig.ts`                     | Defines `AdPlacement` type and `AD_PLACEMENTS`; `adUnitId` resolved from `siteConfig.ads.slots` |
| `src/components/ads/AdProvider.tsx`                | React context; reads `siteConfig.ads.provider`; exposes `renderSlot()`                          |
| `src/components/ads/AdSlot.tsx`                    | Thin 'use client' wrapper — call `useAdProvider().renderSlot()`                                 |
| `src/components/ads/providers/AdSenseProvider.tsx` | `<ins>` element + `adsbygoogle.push()` in `useEffect`                                           |
| `src/components/ads/providers/PrebidProvider.tsx`  | Stub — empty div for future GAM/Prebid                                                          |
| `src/app/providers.tsx`                            | Wraps children with `<AdProvider>` for the whole app                                            |

---

## Ad Placements

Seven named placements, each with configured sizes:

| Placement            | Location                              | Default sizes             |
| -------------------- | ------------------------------------- | ------------------------- |
| `header-leaderboard` | Below navigation                      | 728×90, 970×90, 970×250   |
| `in-content`         | Mid-article (1–2 per post, long-form) | 300×250, 336×280          |
| `sidebar`            | Right column                          | 300×250, 300×600, 160×600 |
| `footer`             | Above copyright                       | 728×90, 970×90, 970×250   |
| `mobile-banner`      | `<md` swap for the above three        | 320×50, 320×100           |
| `in-feed`            | Post list grid (after 3rd card)       | 300×250, 336×280          |
| `below-content`      | Below the article, above tags         | 336×280, 300×250, 728×90  |

Usage anywhere in the component tree:

```tsx
<AdSlot placement="in-content" className="my-6" />
```

`AdSlot` must be rendered inside `<Providers>` (which wraps the whole app via `layout.tsx`).

### Responsive desktop/mobile swap + fallback

`header-leaderboard`, `footer`, and `in-content` each render alongside a
`mobile-banner` sibling: the desktop unit is `hidden md:block` (or
`md:flex`), the mobile unit is the reverse (`md:hidden`) — both stay in the
DOM, only one is visible at a given breakpoint. `AdSlot` takes an optional
`fallbackPlacement`: if the primary placement's slot id isn't configured
(`AD_PLACEMENTS[placement].adUnitId` is empty), it renders the fallback
placement instead. This means a tenant that hasn't set
`NEXT_PUBLIC_ADSENSE_SLOT_MOBILE_BANNER` still gets an ad on mobile (the
desktop unit, swapped in) rather than nothing:

```tsx
<AdSlot placement="mobile-banner" fallbackPlacement="header-leaderboard" />
```

### List pages (in-feed)

`PostList.tsx` (used by home, `/blog`, category, and tag archives) inserts
one `in-feed` cell into the `PostCard` grid — after the 3rd card, so it
lands at the end of a full row on `lg` — via a pure helper,
`insertAdMarker` (`src/domain/post/insertAdIntoList.ts`). The marker is a
plain sentinel object, not a `Post`, so `PostList` type-guards it with
`isAdMarker` and renders `<AdSlot placement="in-feed">` in its place,
styled with the same `rounded-xl`/`ring-1` treatment as `PostCard` so it
reads as a card in the grid. Lists with 3 or fewer posts get no marker;
an unconfigured `in-feed` slot renders nothing (the existing
`AdSenseSlot` null-guard) and the grid simply has one fewer cell.

---

## AdSense Setup

### 1. Configure env vars

```bash
NEXT_PUBLIC_AD_PROVIDER=adsense
NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=ca-pub-1234567890123456

# Get slot IDs from AdSense → Ads → By ad unit
NEXT_PUBLIC_ADSENSE_SLOT_HEADER=1234567890
NEXT_PUBLIC_ADSENSE_SLOT_IN_CONTENT=0987654321
NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR=1122334455
NEXT_PUBLIC_ADSENSE_SLOT_FOOTER=5544332211
```

These are read once, at boot, into `siteConfig.ads` (`src/lib/siteConfig.ts`) —
`AdProvider`, `AdSenseScript`, `AdSenseProvider`, and `adConfig.ts` all read
`siteConfig.ads.*`, never `clientEnv` directly.

### 2. The AdSense script

`layout.tsx` conditionally loads the adsbygoogle script when both `publisherId` and `provider=adsense` are set:

```tsx
{
  siteConfig.ads.provider === 'adsense' && siteConfig.ads.adSensePublisherId && (
    <Script
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${siteConfig.ads.adSensePublisherId}`}
      strategy="afterInteractive"
      crossOrigin="anonymous"
    />
  )
}
```

`strategy="afterInteractive"` is required — `adsbygoogle` cannot run during SSR.

### 3. Why `adsbygoogle.push` is in `useEffect`

`adsbygoogle.push({})` must run **client-side only** after the `<ins>` element is mounted. Calling it during SSR throws `window is not defined`. The `useEffect` in `AdSenseProvider` runs only after hydration:

```typescript
useEffect(() => {
  try {
    ;(window as {...}).adsbygoogle = (window as {...}).adsbygoogle ?? []
    ;((window as {...}).adsbygoogle as unknown[]).push({})
  } catch {
    // script not yet loaded — fires push() when it loads
  }
}, [])
```

The `try/catch` handles the race condition where the component mounts before the AdSense script has finished loading.

### 4. Slot renders `null` when unconfigured

`AdSenseSlot` returns `null` if `config.adUnitId` is empty or `siteConfig.ads.adSensePublisherId` is not set. This prevents broken `<ins>` elements in development or deployments without AdSense configured.

### 5. Reserved layout space (CLS)

Once a slot passes the null-guard above, `getReservedAdDimensions`
(`src/domain/ads/adSize.utils.ts`) derives a conservative box from the
placement's configured `sizes` — `minHeightPx` is the smallest configured
height, `maxWidthPx` the largest configured width — applied to the wrapper
`<div>` as `minHeight` / `maxWidth` / `marginInline: 'auto'`. Placements with
no ad configured stay zero-footprint, since the reservation only runs after
the null-guard.

This is conservative, not exact: a placement whose sizes vary in height
(`header-leaderboard` is `90px`–`250px`) can still shift by the difference
once a taller creative fills. `PrebidProvider.tsx`'s stub wrapper applies
the same reservation so the future GAM provider inherits it.

---

## Content Security Policy

AdSense loads a script, renders ad iframes, and pings a traffic-verification
beacon from several Google-owned hosts. `next.config.ts`'s `headers()` sets a
strict `Content-Security-Policy` (built by `src/lib/csp.ts`), so each of
those hosts must be explicitly allow-listed or the browser blocks the
request.

| Directive     | Google hosts added for AdSense                                                                                                                         | Why                                                                                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `script-src`  | `pagead2.googlesyndication.com`, `partner.googleadservices.com`, `tpc.googlesyndication.com`, `*.adtrafficquality.google`, `www.googletagservices.com` | Loads the AdSense/GPT bootstrap script and the sodar traffic-quality script                                                                                    |
| `frame-src`   | `googleads.g.doubleclick.net`, `tpc.googlesyndication.com`, `*.adtrafficquality.google`, `www.google.com`                                              | AdSense renders each ad unit as a sandboxed iframe                                                                                                             |
| `connect-src` | `pagead2.googlesyndication.com`, `googleads.g.doubleclick.net`, `*.adtrafficquality.google`, `*.google.com`, `*.googlesyndication.com`                 | The sodar beacon (`ep1.adtrafficquality.google/getconfig/sodar`) reports invalid-traffic signals; blocking it risks impressions being discounted as unverified |

`*.google.com`, `*.googlesyndication.com`, and `*.adtrafficquality.google`
are wildcarded because AdSense rotates the exact subdomain it uses — most
recently the numbered `adtrafficquality` "sodar" endpoints (`ep1`, `ep2`,
…), which is exactly what broke production and led to
[BLO-195](https://linear.app/vex-agency/issue/BLO-195). Every other
directive (`default-src`, `style-src`, `img-src`, `font-src`) is unrelated
to ads and stays untouched.

The allow-list lives in `src/lib/csp.ts` (unit-tested in `csp.test.ts`), not
inline in `next.config.ts`, so it can be reviewed and tested independently —
see `src/lib/redirects.ts` for the same pattern applied to redirects.

**Known limitation:** Google's current guidance
([support.google.com/adsense/answer/16283098](https://support.google.com/adsense/answer/16283098))
says they only _officially_ support nonce-based "strict CSP," not a domain
allowlist, and warns a stale allowlist can disrupt ad serving. This
allowlist is a pragmatic stopgap that matches the rest of this repo's static
`next.config.ts` header — revisit with a nonce-based CSP (requires
middleware, not a static header) if AdSense CSP violations recur.

**Not yet added:** BLO-139 (Google Publisher Tag / GAM, milestone M2) will
need `securepubads.g.doubleclick.net` in `script-src`/`connect-src` and
`*.safeframe.googlesyndication.com` in `frame-src`. Add those when that
ticket lands, not before.

---

## `PostBody` In-Content Ads + Below-Content

`splitContentForAds` (`src/domain/post/splitContentForAd.ts`) splits post
content into fragments at fixed paragraph boundaries — after the 3rd
paragraph, then every 8 paragraphs after that, capped at 2 splits (3
fragments) — and never splits inside the trailing 2 paragraphs of the post.
A short post (too few paragraphs to reach the first split point) comes back
as a single-element array, so `PostBody` renders it with no ads interleaved:

```tsx
const fragments = splitContentForAds(content)
// fragments.map(...) renders each fragment, with an in-content AdSlot pair
// (desktop + mobile-banner fallback) between every pair of fragments
```

Same wrapper-unwrap/re-wrap rule as the original single-split helper
(`splitContentForAd`, kept for backwards compatibility) so every fragment
stays hydration-safe — a `<div>`/`<section>`/`<article>` wrapper is
detected once, stripped before splitting, and re-applied to each fragment.

Each in-content position renders the desktop/mobile responsive pair, same
as Header/Footer:

```tsx
<AdSlot placement="in-content" className="not-prose my-6 hidden md:block" />
<AdSlot
  placement="mobile-banner"
  fallbackPlacement="in-content"
  className="not-prose my-6 md:hidden"
/>
```

The `not-prose` class prevents Tailwind Typography from applying article
styles to the ad container.

A separate `below-content` placement renders once, between `<PostBody>` and
`<TagList>` in `src/app/blog/[slug]/page.tsx` — the highest-attention
position after the reader finishes the article:

```tsx
<AdSlot placement="below-content" className="my-8" />
```

Policy guardrail: at most 2 in-content + 1 below-content per article.

---

## Provider Migration Path

### Stage 1 — AdSense (current default)

`NEXT_PUBLIC_AD_PROVIDER=adsense`

Simple, no GAM needed. `AdSenseProvider` renders `<ins class="adsbygoogle">` per placement.

### Stage 2 — Prebid / Header Bidding

When ready to add header bidding (higher CPMs):

1. Create a GAM account and SSP seats (Amazon TAM, Criteo, Index Exchange, etc.)
2. Implement `src/components/ads/providers/PrebidProvider.tsx` using `googletag` + `pbjs`
3. Set `NEXT_PUBLIC_AD_PROVIDER=prebid`
4. **No changes needed** to `AdSlot`, routes, or any other component

The `AdSlot` → `useAdProvider().renderSlot()` → provider switch is the only change path.

---

## Disabling Ads Per Deployment

To deploy a team site without ads:

- Leave `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID` unset, or
- Set slot IDs to empty strings

`AdSenseSlot` returns `null` when either is missing — no `<ins>` elements render, no console errors.
