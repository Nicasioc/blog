import type { NextConfig } from 'next'

type RedirectRule = Awaited<ReturnType<NonNullable<NextConfig['redirects']>>>[number]

/**
 * Permanent (308) redirects, wired into `next.config.ts`.
 *
 * Kept here so the list is reviewable and testable on its own rather than
 * buried in the config object.
 */
export const permanentRedirects: RedirectRule[] = [
  {
    // BLO-160: this category's slug was hand-entered with a capital I. The CMS
    // migration lowercased the stored slug, so every canonical/sitemap/internal
    // link now points at `/category/institucionales`; the old casing that
    // Search Console still knows about redirects here.
    source: '/category/Institucionales',
    destination: '/category/institucionales',
    permanent: true,
  },
]
