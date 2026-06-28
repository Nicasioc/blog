import Link from 'next/link'
import { siteConfig } from '@/lib/siteConfig'

export const SiteLogo = () => (
  <Link href="/" aria-label={siteConfig.siteName}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src={siteConfig.logoUrl}
      alt={siteConfig.siteName}
      width={120}
      height={40}
      className="h-14 w-auto"
    />
  </Link>
)
