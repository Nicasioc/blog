import Link from 'next/link'
import { SiteLogo } from './SiteLogo'
import { AdSlot } from '@/components/ads/AdSlot'
import { buildNavLinks } from '@/domain/navigation/navLinks'
import { siteConfig } from '@/lib/siteConfig'

const navLinkClass =
  'text-primary-foreground/80 hover:text-brand-secondary hover:bg-primary-foreground/10 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150'

const NAV_LINKS = buildNavLinks(siteConfig.forumUrl)

export const Header = () => (
  <header className="bg-primary border-brand-secondary sticky top-0 z-50 border-b-4 shadow-sm">
    <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-3">
      <SiteLogo />
      <nav className="flex items-center gap-1 sm:gap-2">
        {NAV_LINKS.map(({ label, href, external }) =>
          external ? (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={navLinkClass}
            >
              {label}
            </a>
          ) : (
            <Link key={href} href={href} className={navLinkClass}>
              {label}
            </Link>
          ),
        )}
      </nav>
    </div>
    <div className="container mx-auto hidden justify-center px-4 pb-2 empty:hidden md:flex">
      <AdSlot placement="header-leaderboard" />
    </div>
    <div className="container mx-auto flex justify-center px-4 pb-2 empty:hidden md:hidden">
      <AdSlot placement="mobile-banner" fallbackPlacement="header-leaderboard" />
    </div>
  </header>
)
