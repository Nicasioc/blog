import Link from 'next/link'
import { siteConfig } from '@/lib/siteConfig'
import { STATIC_PAGES } from '@/lib/staticPages'
import { AdSlot } from '@/components/ads/AdSlot'
import { CookiePreferencesButton } from '@/components/consent/CookiePreferencesButton'

export const Footer = () => (
  <footer className="bg-primary border-brand-secondary mt-16 border-t-4">
    <div className="container mx-auto flex justify-center px-4 py-4 empty:hidden">
      <AdSlot placement="footer" />
    </div>
    <nav
      aria-label="Enlaces legales"
      className="container mx-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 pt-6"
    >
      {STATIC_PAGES.map(({ href, title }) => (
        <Link
          key={href}
          href={href}
          className="text-primary-foreground/80 hover:text-brand-secondary hover:bg-primary-foreground/10 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150"
        >
          {title}
        </Link>
      ))}
      <CookiePreferencesButton />
    </nav>
    <p className="text-primary-foreground/60 container mx-auto px-4 pt-2 pb-6 text-center text-xs">
      &copy; {new Date().getFullYear()} {siteConfig.siteName}. Todos los derechos reservados.
    </p>
  </footer>
)
