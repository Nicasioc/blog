import Link from 'next/link'
import { SiteLogo } from './SiteLogo'
import { AdSlot } from '@/components/ads/AdSlot'

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Blog', href: '/blog' },
]

export const Header = () => (
  <header className="bg-primary border-brand-secondary border-b-4">
    <div className="container mx-auto flex items-center justify-between px-4 py-3">
      <SiteLogo />
      <nav className="flex gap-6">
        {NAV_LINKS.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            className="text-primary-foreground/80 hover:text-brand-secondary text-sm font-medium transition-colors duration-150"
          >
            {label}
          </Link>
        ))}
      </nav>
    </div>
    <div className="container mx-auto flex justify-center px-4 py-2">
      <AdSlot placement="header-leaderboard" />
    </div>
  </header>
)
