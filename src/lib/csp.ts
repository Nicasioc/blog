/**
 * Content-Security-Policy directives, wired into `next.config.ts`.
 *
 * Kept here (mirroring `redirects.ts`) so the allow-list is reviewable and
 * testable on its own rather than buried in the config object.
 *
 * Google AdSense loads scripts, renders ad iframes, and pings a rotating set
 * of `*.googlesyndication.com` / `*.doubleclick.net` / `*.google.com` hosts,
 * plus the `*.adtrafficquality.google` "sodar" invalid-traffic verification
 * endpoints (wildcarded, not `ep1`/`ep2` explicitly — Google adds numbered
 * endpoints without notice; that's exactly how BLO-195 happened). Without
 * these, `connect-src 'self'` silently blocks the sodar beacon and AdSense
 * treats the resulting impressions as unverified, which can depress
 * fill/CPMs. See BLO-195.
 *
 * Known gap: Google's current guidance (support.google.com/adsense/answer/16283098)
 * says they only *officially* support nonce-based "strict CSP," not a domain
 * allowlist, and warns a stale allowlist can disrupt ad serving. We're
 * shipping the allowlist anyway (matches this repo's existing static-header
 * pattern, no middleware/nonce plumbing required) — revisit if AdSense CSP
 * violations recur after this fix, since that's the documented failure mode
 * of the allowlist approach.
 *
 * Google Publisher Tag (GAM) adds `https://securepubads.g.doubleclick.net`
 * (the gpt.js origin, which also serves ad requests) to script-src/connect-src
 * and, alongside it, `https://*.safeframe.googlesyndication.com` to frame-src —
 * GPT renders creatives inside SafeFrame iframes served from per-account
 * subdomains. Hosts cross-checked against
 * developers.google.com/publisher-tag/guides/content-security-policy.
 * These are inert while `NEXT_PUBLIC_AD_PROVIDER` is `adsense` (GamScript
 * renders nothing), so they ship ahead of the provider flip. See BLO-139.
 */
export const buildCsp = (isDev: boolean): string =>
  [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://pagead2.googlesyndication.com https://partner.googleadservices.com https://tpc.googlesyndication.com https://*.adtrafficquality.google https://www.googletagservices.com https://securepubads.g.doubleclick.net`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    'frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://*.adtrafficquality.google https://www.google.com https://securepubads.g.doubleclick.net https://*.safeframe.googlesyndication.com',
    "connect-src 'self' https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://*.adtrafficquality.google https://*.google.com https://*.googlesyndication.com https://securepubads.g.doubleclick.net",
  ].join('; ')
