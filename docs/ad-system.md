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

| File | Role |
|------|------|
| `src/services/ads/adConfig.ts` | Defines `AdPlacement` type and `AD_PLACEMENTS` config |
| `src/components/ads/AdProvider.tsx` | React context; reads `NEXT_PUBLIC_AD_PROVIDER`; exposes `renderSlot()` |
| `src/components/ads/AdSlot.tsx` | Thin 'use client' wrapper — call `useAdProvider().renderSlot()` |
| `src/components/ads/providers/AdSenseProvider.tsx` | `<ins>` element + `adsbygoogle.push()` in `useEffect` |
| `src/components/ads/providers/PrebidProvider.tsx` | Stub — empty div for future GAM/Prebid |
| `src/app/providers.tsx` | Wraps children with `<AdProvider>` for the whole app |

---

## Ad Placements

Four named placements, each with configured sizes:

| Placement | Location | Default sizes |
|-----------|----------|--------------|
| `header-leaderboard` | Below navigation | 728×90, 970×90 |
| `in-content` | Mid-article (after 3rd `</p>`) | 300×250, 336×280 |
| `sidebar` | Right column | 300×250, 300×600 |
| `footer` | Above copyright | 728×90, 970×90 |

Usage anywhere in the component tree:
```tsx
<AdSlot placement="in-content" className="my-6" />
```

`AdSlot` must be rendered inside `<Providers>` (which wraps the whole app via `layout.tsx`).

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

### 2. The AdSense script

`layout.tsx` conditionally loads the adsbygoogle script when both `publisherId` and `provider=adsense` are set:

```tsx
{siteConfig.adProvider === 'adsense' && siteConfig.adSensePublisherId && (
  <Script
    src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${siteConfig.adSensePublisherId}`}
    strategy="afterInteractive"
    crossOrigin="anonymous"
  />
)}
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

`AdSenseSlot` returns `null` if `config.adUnitId` is empty or `siteConfig.adSensePublisherId` is not set. This prevents broken `<ins>` elements in development or deployments without AdSense configured.

---

## `PostBody` In-Content Ad

`PostBody.tsx` splits post content at the 3rd `</p>` tag and inserts an `<AdSlot>` between the halves:

```typescript
const parts = content.split('</p>')
const splitAt = Math.min(3, Math.floor(parts.length / 2))
const before = parts.slice(0, splitAt).join('</p>') + '</p>'
const after = parts.slice(splitAt).join('</p>')
```

The `not-prose` class on the `AdSlot` wrapper prevents Tailwind Typography from applying article styles to the ad container:

```tsx
<AdSlot placement="in-content" className="my-6 not-prose" />
```

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
