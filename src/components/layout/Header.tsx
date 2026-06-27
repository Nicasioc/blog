import Link from 'next/link'
import { SiteLogo } from './SiteLogo'
import { AdSlot } from '@/components/ads/AdSlot'

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Blog', href: '/blog' },
]

export const Header = () => (
  <header className="bg-primary border-b-4 border-brand-secondary">
    <div className="container mx-auto px-4 py-3 flex items-center justify-between">
      <SiteLogo />
      <nav className="flex gap-6">
        {NAV_LINKS.map(({ label, href }) => (
          <Link key={href} href={href} className="text-sm font-medium text-primary-foreground/80 hover:text-brand-secondary transition-colors duration-150">
            {label}
          </Link>
        ))}
      </nav>
    </div>
    <div className="container mx-auto px-4 py-2 flex justify-center">
      <AdSlot placement="header-leaderboard" />
    </div>
  </header>
)
