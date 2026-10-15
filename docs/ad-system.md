# Ad System

The ad system is designed for **provider-agnostic placement**. Pages and components only use `<AdSlot placement="...">` — the underlying provider (AdSense or GAM) is swapped via a single env var without touching any component.

## Architecture

```
<AdSlot placement="sidebar" />
    │  (Client Component)
    ▼
useAdProvider().renderSlot('sidebar')
    │  (React context from AdProvider)
    ▼
AdSenseSlot | GamSlot | null
    │  (active provider component)
    ▼
<ins class="adsbygoogle" ...> | <div id="gpt-…"> (GPT iframe)
```

### Key Files

| File                                               | Role                                                                                                                                                      |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/siteConfig.ts`                            | Single read surface for ad config — `siteConfig.ads.{provider,adSensePublisherId,slots,gamNetworkCode,gamSlots}`                                          |
| `src/services/ads/adConfig.ts`                     | Defines `AdPlacement` type and `AD_PLACEMENTS`; `adUnitId` resolved from `siteConfig.ads.slots`; `getGamAdUnitPath` (GAM ad unit path, used by `GamSlot`) |
| `src/components/ads/AdProvider.tsx`                | React context; reads `siteConfig.ads.provider`; exposes `renderSlot()`                                                                                    |
| `src/components/ads/AdSlot.tsx`                    | Thin 'use client' wrapper — call `useAdProvider().renderSlot()`                                                                                           |
| `src/components/ads/providers/AdSenseProvider.tsx` | `<ins>` element + `adsbygoogle.push()` in `useEffect`                                                                                                     |
| `src/components/ads/providers/GamProvider.tsx`     | `GamSlot` — reserved `<div>` + GPT slot lifecycle via `src/services/ads/gpt.ts`                                                                           |
| `src/components/ads/ReservedAdContainer.tsx`       | Shared `w-full` wrapper with reserved `minHeight`/`maxWidth` (BLO-191/BLO-134), used by both providers                                                    |
| `src/services/ads/gpt.ts`                          | GPT service: one-time SRA/services init, batched `refresh()`, slot define/destroy, `nonPersonalizedAds`                                                   |
| `src/components/ads/AdSenseScript.tsx`             | Loads `adsbygoogle.js` once, gated on `ads.enabled`/provider/publisher id                                                                                 |
| `src/components/ads/GamScript.tsx`                 | Loads `gpt.js` + the `googletag.cmd` queue (gated on `ads.enabled`/provider/network code); applies page-level `nonPersonalizedAds`                        |
| `src/domain/ads/gamSizeMapping.utils.ts`           | `buildGamSizeMapping` — per-breakpoint size buckets for `slot.defineSizeMapping()` (used by `GamSlot`)                                                    |
| `src/app/providers.tsx`                            | Wraps children with `<AdProvider>` and mounts `<AdSenseScript>` + `<GamScript>`, for the whole app                                                        |

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
`fallbackPlacement`: under **AdSense**, if the primary placement isn't
configured (`AD_PLACEMENTS[placement].adUnitId` is empty), it renders the
fallback placement instead. This means a tenant that hasn't set
`NEXT_PUBLIC_ADSENSE_SLOT_MOBILE_BANNER` still gets an ad on mobile (the
responsive desktop unit, swapped in) rather than nothing. Under **GAM** there
is no fallback (`resolveAdPlacement` in `adConfig.ts`): the fallbacks are the
desktop leaderboards, whose GAM mobile size bucket is empty by design, so
falling back would only render a blank reserved box on phones.

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

`src/components/ads/AdSenseScript.tsx`, mounted once via `src/app/providers.tsx`
(wraps the whole app, alongside `<AdProvider>`), loads the adsbygoogle script
when `ads.enabled`, `provider === 'adsense'`, and `adSensePublisherId` are all
set:

```tsx
export const AdSenseScript = () => {
  if (!siteConfig.ads.enabled) return null
  if (siteConfig.ads.provider !== 'adsense' || !siteConfig.ads.adSensePublisherId) return null

  return (
    <Script
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${siteConfig.ads.adSensePublisherId}`}
      strategy="afterInteractive"
      crossOrigin="anonymous"
    />
  )
}
```

`strategy="afterInteractive"` is required — `adsbygoogle` cannot run during
SSR. The script loads for every visitor regardless of consent status — see
"Consent gating" below for what consent actually controls.

### 3. Why `adsbygoogle.push` is in `useEffect`

`adsbygoogle.push({})` must run **client-side only** after the `<ins>` element
is mounted. Calling it during SSR throws `window is not defined`. The
`useEffect` in `AdSenseProvider` runs only after hydration, and a `hasPushed`
ref guards against pushing more than once per slot even though the effect
itself re-runs whenever `personalization` changes (see "Consent gating"
below for why it needs to):

```typescript
const hasPushed = useRef(false)

useEffect(() => {
  try {
    const adsbygoogle = (window.adsbygoogle = window.adsbygoogle ?? [])
    adsbygoogle.requestNonPersonalizedAds = personalization === 'non-personalized' ? 1 : 0
    if (!hasPushed.current) {
      hasPushed.current = true
      adsbygoogle.push({})
    }
  } catch {
    // script not yet loaded — fires push() when it loads
  }
}, [personalization])
```

The `try/catch` handles the race condition where the component mounts before
the AdSense script has finished loading.

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
once a taller creative fills. `GamSlot` applies the same reservation (and
the same `w-full` wrapper) to its GPT div.

### 6. Consent gating: personalization, not blocking

Decided 2026-09-19 (project owner): an unanswered consent banner or an
explicit reject no longer blocks ads outright — only an explicit **accept**
earns personalized ads; `null` (unanswered) and `rejected` both get
**non-personalized** ads, never zero ads. `AdSenseScript` loads
`adsbygoogle.js` for every visitor (once provider/publisher/`ads.enabled`
allow it) regardless of consent status — consent no longer gates the script
itself.

`src/domain/consent/adPersonalization.ts` — `getAdPersonalization(status)` —
is the single consent → personalization decision for the whole project;
GPT reuses the same helper (see "GAM slots" below), don't create a second one.
`AdProvider` derives `personalization` once per render and passes it to
`AdSenseSlot`, which sets `window.adsbygoogle.requestNonPersonalizedAds`
(`1` or `0`) immediately before its own `push({})`:

```tsx
const adsbygoogle = (window.adsbygoogle = window.adsbygoogle ?? [])
adsbygoogle.requestNonPersonalizedAds = personalization === 'non-personalized' ? 1 : 0
adsbygoogle.push({})
```

The effect depends on `personalization` and re-runs whenever it changes, but
a `hasPushed` ref guards `push({})` to once per slot (see "Why
`adsbygoogle.push` is in `useEffect`" above) — so the flag stays in sync with
the latest consent decision even though the slot is only requested once.
This isn't just tidiness: `useConsent()` is backed by `useSyncExternalStore`
with a server snapshot of `null`, so the very first client render after
hydration briefly sees `null` (→ non-personalized) before correcting to the
real localStorage value — a naive "capture personalization once at mount"
implementation freezes that transient wrong value for every returning
visitor with existing accepted consent, not just react to later in-session
changes. Caught during BLO-193 by testing all three consent states live in a
browser, not by unit tests (synchronous `render()` calls can't reproduce the
SSR-then-correct sequence).

Google still sets cookies in non-personalized mode (frequency capping,
invalid-traffic detection), so the privacy page and consent banner copy
describe this as "no personalized ads," not "no ads" / "no cookies."

---

## GAM (Google Ad Manager) Setup

Set `NEXT_PUBLIC_AD_PROVIDER=gam` plus the env vars below and every
`<AdSlot>` renders a GPT slot instead of an AdSense `<ins>` — no call-site
changes. The pieces: config/env (BLO-137), size mapping (BLO-138), the GPT
loader (BLO-139) and `GamSlot` (BLO-140).

### Env vars

| Env var                              | Required               | Description                                                        |
| ------------------------------------ | ---------------------- | ------------------------------------------------------------------ |
| `NEXT_PUBLIC_GAM_NETWORK_CODE`       | when provider is `gam` | Numeric GAM network code (Admin → Global settings → Network code). |
| `NEXT_PUBLIC_GAM_SLOT_HEADER`        | optional               | Ad unit name for `header-leaderboard`.                             |
| `NEXT_PUBLIC_GAM_SLOT_IN_CONTENT`    | optional               | Ad unit name for `in-content`.                                     |
| `NEXT_PUBLIC_GAM_SLOT_SIDEBAR`       | optional               | Ad unit name for `sidebar`.                                        |
| `NEXT_PUBLIC_GAM_SLOT_FOOTER`        | optional               | Ad unit name for `footer`.                                         |
| `NEXT_PUBLIC_GAM_SLOT_MOBILE_BANNER` | optional               | Ad unit name for `mobile-banner`.                                  |
| `NEXT_PUBLIC_GAM_SLOT_IN_FEED`       | optional               | Ad unit name for `in-feed`.                                        |
| `NEXT_PUBLIC_GAM_SLOT_BELOW_CONTENT` | optional               | Ad unit name for `below-content`.                                  |

Each `NEXT_PUBLIC_GAM_SLOT_*` value is the leaf/sub-path ad-unit name, not the
full ad unit path. `getGamAdUnitPath(placement)` assembles
`/${networkCode}/${slotName}` from `siteConfig.ads.gamNetworkCode` and
`siteConfig.ads.gamSlots[placement]`, returning `undefined` when either half
is unset — mirroring the AdSense empty-slot null-guard described above.

### The GPT script

`src/components/ads/GamScript.tsx`, mounted once via `src/app/providers.tsx`
alongside `<AdSenseScript />` (each self-gates by provider, so both are
mounted unconditionally), loads `gpt.js` when `ads.enabled`,
`provider === 'gam'`, and `gamNetworkCode` are all set. Like AdSense after
BLO-193, **consent does not gate the tag itself** — it only drives ad
personalization (see "GAM slots" below).

The `googletag.cmd` queue is initialised at **module scope**, not from an
inline `<Script>`:

```tsx
if (typeof window !== 'undefined' && isGamConfigured()) {
  const w = window as { googletag?: { cmd: unknown[] } }
  w.googletag = w.googletag ?? { cmd: [] }
}
```

This is deliberate and was corrected during BLO-139 after checking a real DOM
dump. `next/script` hoists an `afterInteractive` **external** script straight
into `<head>`, while an inline `<Script>` rendered next to it stays where the
component sits in the tree — so the "init first, then `gpt.js`" ordering that
reads correctly in JSX is the opposite of what the browser does (the inline
tag landed ~104KB further down the document, long after `gpt.js` had been
requested). Module scope runs when the client bundle imports the file, which
is before hydration and therefore before any `GamSlot` effect
can push a command. `gpt.js` reuses an existing `window.googletag` rather than
replacing it, then drains whatever queued up while it was in flight.

### Responsive size mapping

`buildGamSizeMapping` (`src/domain/ads/gamSizeMapping.utils.ts`) turns a
placement's configured sizes into a `googletag.sizeMapping()`-shaped build
array — pure data, no `googletag` import — for `GamSlot` to
pass to `slot.defineSizeMapping()`. A size is eligible at a breakpoint when
its width fits the available space: `container mx-auto px-4` (this repo's
layout gutter, 16px each side = 32px) subtracted from that breakpoint's
viewport width, matching the `md`/`lg` breakpoints already used for the
mobile-banner responsive swap.

| Bucket (`[viewport, 0]`) | Eligibility width | Adds                                                |
| ------------------------ | ----------------- | --------------------------------------------------- |
| `[0, 0]` (mobile)        | 368px             | 320×50, 320×100, 300×250, 336×280, 300×600, 160×600 |
| `[768, 0]` (`md`)        | 768px             | + 728×90                                            |
| `[1024, 0]` (`lg`)       | 1024px            | + 970×90, 970×250                                   |

The mobile bucket's eligibility width is 368px, not the raw 0px viewport or a
plain 320px floor: 336 (this repo's narrowest configured rectangle size,
336×280) plus the 32px gutter is exactly 368 — the smallest viewport where
that size fits under the _same_ width-fit rule used for the other two
buckets, rather than a special-cased threshold. Buckets are cumulative (each
wider breakpoint includes everything narrower breakpoints do, since a larger
eligibility width is always a superset) — this fixes the original spec's
"320-family only" mobile bucket, which excluded every rectangle placement
(`in-content`, `sidebar`, `in-feed`, `below-content`) below `md` even though
300px/336px-wide creatives fit a phone screen fine.

**`header-leaderboard` and `footer` get an empty mobile bucket by design** —
their configured sizes are desktop-leaderboard-only (728×90, 970×90,
970×250), none of which fit any believable phone width. Small viewports are
covered by the separate `mobile-banner` placement (its own `AdSlot`,
responsive-swapped in at the component level — see "Responsive desktop/mobile
swap" above), not by shrinking a leaderboard's GAM size mapping.

### GAM slots

`GamSlot` (`src/components/ads/providers/GamProvider.tsx`) renders the
reserved, `w-full` `<div>` and hands the GPT lifecycle to
`src/services/ads/gpt.ts`. Everything goes through `googletag.cmd`, so it
works whether or not `gpt.js` has loaded yet.

- **Div id:** `gpt-${placement}-${useId()}`, stripped to `[A-Za-z0-9_-]`
  (`useId()` emits `:`/`«»`).
- **Services, once per page:** the first slot's command calls
  `enableSingleRequest()`, `disableInitialLoad()` and `enableServices()`,
  guarded by a module-level flag.
- **Per slot:** `defineSlot(getGamAdUnitPath(placement), sizes, divId)`, then
  `defineSizeMapping(buildGamSizeMapping(sizes))`, `addService(pubads())`
  and `display(divId)`.
- **Batched fetch (SRA):** because of `disableInitialLoad()`, `display()`
  only registers the slot. The slot is added to a pending batch, and a
  microtask calls `pubads().refresh(batch)` once. `gpt.js` drains its queue
  synchronously when it loads, so every slot mounted during hydration is
  fetched in a single request. Without this, enabling SRA does nothing when
  slots are defined one React effect at a time.
- **Unmount:** `destroySlots([slot])`. If the cleanup runs before `gpt.js`
  has drained the queue (React strict mode's mount → unmount → mount, or a
  fast client navigation), the pending define is cancelled, so the slot is
  defined exactly once.
- **Hidden containers are skipped:** the responsive swaps above keep both
  units in the DOM and hide one with CSS. GPT's size mapping only looks at
  the viewport, so `GamSlot` doesn't define a slot whose div has no layout
  box (`isElementRendered`, `src/utils/dom.ts`). A resize across a
  breakpoint won't load the newly visible slot until the next mount; viewport
  lazy-loading (BLO-144) replaces this check.
- **Consent (page-level):** `GamScript` applies
  `pubads().setPrivacySettings({ nonPersonalizedAds })` from the same
  `getAdPersonalization(status)` AdSense uses, re-running whenever consent
  changes (including the post-hydration correction from the SSR `null`
  snapshot, see "Consent gating" above). Order against the slot defines
  doesn't matter: the batched fetch runs in a microtask after `gpt.js`
  drains the whole queue. When a visitor **accepts** mid-page, slots that
  were already fetched non-personalized are refreshed once so they switch to
  personalized; slots still in the pending batch aren't double-fetched, and
  withdrawing consent applies to future requests only.
- **Not configured:** `GamSlot` returns `null`, with no div and no queued
  commands, when `getGamAdUnitPath(placement)` is `undefined` (network code
  or that placement's slot name unset).

---

## `ads.txt`

`src/app/ads.txt/route.ts` serves `/ads.txt` from `buildAdsTxtContent`
(`src/domain/ads/adsTxt.utils.ts`), which merges:

1. the Google `DIRECT` line generated from `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID`
   (when set), then
2. every entry in the server-only `ADS_TXT_EXTRA_LINES` env var, in order.

Entries in `ADS_TXT_EXTRA_LINES` are separated by `|` (single-line value) or
newlines (multi-line value); blank lines and lines starting with `#` are
dropped. Duplicates are removed keeping the first occurrence, ignoring
whitespace, comma spacing, a trailing `# comment` and case in every field
except the seller account id (which an exchange may treat as
case-sensitive). With no publisher id and no extras the route returns 404.

`/ads.txt` is prerendered at build time, so — like every other env var on
Vercel — **changing `ADS_TXT_EXTRA_LINES` takes effect on the next
deployment**; redeploy after editing it.

It is an env var rather than a committed file because this is a white-label
platform: each tenant has its own publisher accounts and demand partners. GAM
requires its own `google.com, pub-XXXX, DIRECT, f08c47fec0942fa0` line keyed by
the **GAM** publisher id, which can differ from the AdSense one — that line
goes here.

```bash
ADS_TXT_EXTRA_LINES="google.com, pub-9999999999999999, DIRECT, f08c47fec0942fa0|appnexus.com, 12345, RESELLER, f5ab79cb980f11d1"
```

## Content Security Policy

AdSense loads a script, renders ad iframes, and pings a traffic-verification
beacon from several Google-owned hosts. `next.config.ts`'s `headers()` sets a
strict `Content-Security-Policy` (built by `src/lib/csp.ts`), so each of
those hosts must be explicitly allow-listed or the browser blocks the
request.

| Directive     | Google hosts allow-listed                                                                                                                                                                | Why                                                                                                                                                            |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `script-src`  | `pagead2.googlesyndication.com`, `partner.googleadservices.com`, `tpc.googlesyndication.com`, `*.adtrafficquality.google`, `www.googletagservices.com`, `securepubads.g.doubleclick.net` | Loads the AdSense/GPT bootstrap script and the sodar traffic-quality script                                                                                    |
| `frame-src`   | `googleads.g.doubleclick.net`, `tpc.googlesyndication.com`, `*.adtrafficquality.google`, `www.google.com`, `securepubads.g.doubleclick.net`, `*.safeframe.googlesyndication.com`         | AdSense renders each ad unit as a sandboxed iframe; GPT renders creatives in SafeFrame iframes on per-account subdomains                                       |
| `connect-src` | `pagead2.googlesyndication.com`, `googleads.g.doubleclick.net`, `*.adtrafficquality.google`, `*.google.com`, `*.googlesyndication.com`, `securepubads.g.doubleclick.net`                 | The sodar beacon (`ep1.adtrafficquality.google/getconfig/sodar`) reports invalid-traffic signals; blocking it risks impressions being discounted as unverified |

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

The GPT hosts (`securepubads.g.doubleclick.net`,
`*.safeframe.googlesyndication.com`) landed with BLO-139, cross-checked
against
[Google's Publisher Tag CSP guide](https://developers.google.com/publisher-tag/guides/content-security-policy).
They are inert while the provider is `adsense` — `GamScript` renders nothing,
so nothing requests those origins — which is why they ship ahead of the
provider flip rather than alongside it.

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

### Stage 2 — Google Ad Manager (shipped)

`NEXT_PUBLIC_AD_PROVIDER=gam`

1. Set up the GAM network and one ad unit per placement (BLO-142).
2. Set `NEXT_PUBLIC_GAM_NETWORK_CODE` and the `NEXT_PUBLIC_GAM_SLOT_*` vars
   (see "GAM (Google Ad Manager) Setup" above), plus the GAM publisher's
   `ads.txt` line.
3. Set `NEXT_PUBLIC_AD_PROVIDER=gam`. **No changes needed** to `AdSlot`,
   routes or any other component.

### Future — header bidding

Prebid.js layers on top of GAM (bids flow into GPT as key-values before
`refresh()`), so it doesn't need a separate provider. The old
`PrebidProvider` stub and the `prebid` provider value were removed in
BLO-140; header bidding is a separate future project that would extend
`src/services/ads/gpt.ts`.

---

## Disabling Ads Per Deployment

Three ways to disable ads, from broadest to narrowest:

- **`NEXT_PUBLIC_ADS_ENABLED=false`** — the explicit site-wide switch. `AdProvider.renderSlot` short-circuits to `null` before the provider `switch`, and `AdSenseScript` never loads `adsbygoogle.js` — even with consent accepted. Defaults to `true` when unset.
- Leave `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID` unset — disables AdSense entirely (no script, no `<ins>` anywhere), same effect as the switch above but implicit.
- Set an individual placement's slot id to an empty string — disables just that one placement; every other configured slot still renders.

`AdSenseSlot` returns `null` when any of these apply — no `<ins>` elements render, no console errors. With `provider=gam`, the GAM equivalents are leaving `NEXT_PUBLIC_GAM_NETWORK_CODE` unset (no `gpt.js`, no slots) or setting a single `NEXT_PUBLIC_GAM_SLOT_*` to an empty string (`GamSlot` returns `null` for that placement).
