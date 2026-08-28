import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV === 'development'

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://pagead2.googlesyndication.com https://partner.googleadservices.com https://tpc.googlesyndication.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self'",
  'frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com',
  "connect-src 'self'",
].join('; ')

// The Payload CMS serves media from `<origin>/api/media/file/<name>`. Access
// control stays on there, so `media.url` is that proxy route (not a raw
// Cloudinary URL) and comes back root-relative. We rewrite `/api/media/file/*`
// on this domain through to the CMS so `next/image` can treat it as a local path.
const cmsOrigin = new URL(process.env.PAYLOAD_API_URL ?? 'https://blog-cms-snowy.vercel.app/api')
  .origin

const nextConfig: NextConfig = {
  images: {
    // Only used if a media URL is ever absolute (e.g. the CMS sets `serverURL`);
    // the rewrite below keeps the common case a local path.
    remotePatterns: [{ protocol: 'https', hostname: new URL(cmsOrigin).hostname }],
    formats: ['image/avif', 'image/webp'],
  },
  async rewrites() {
    return [{ source: '/api/media/file/:path*', destination: `${cmsOrigin}/api/media/file/:path*` }]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ]
  },
}

export default nextConfig
