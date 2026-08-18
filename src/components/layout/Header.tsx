import Link from 'next/link'
import { SiteLogo } from './SiteLogo'
import { AdSlot } from '@/components/ads/AdSlot'

const NAV_LINKS = [
  { label: 'Inicio', href: '/' },
  { label: 'Blog', href: '/blog' },
]

export const Header = () => (
  <header className="bg-primary border-brand-secondary sticky top-0 z-50 border-b-4 shadow-sm">
    <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-3">
      <SiteLogo />
      <nav className="flex items-center gap-1 sm:gap-2">
        {NAV_LINKS.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            className="text-primary-foreground/80 hover:text-brand-secondary hover:bg-primary-foreground/10 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150"
          >
            {label}
          </Link>
        ))}
      </nav>
    </div>
    <div className="container mx-auto flex justify-center px-4 pb-2 empty:hidden">
      <AdSlot placement="header-leaderboard" />
    </div>
  </header>
)
