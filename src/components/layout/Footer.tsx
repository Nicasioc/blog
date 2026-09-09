import Link from 'next/link'
import { getFooterData } from '@/application/blog/getFooterData'
import { siteConfig } from '@/lib/siteConfig'
import { STATIC_PAGES } from '@/lib/staticPages'
import { AdSlot } from '@/components/ads/AdSlot'
import { CookiePreferencesButton } from '@/components/consent/CookiePreferencesButton'

const linkClass =
  'text-primary-foreground/80 hover:text-brand-secondary rounded-md text-sm transition-colors duration-150'

export const Footer = async () => {
  const { categories, recentPosts } = await getFooterData()

  return (
    <footer className="bg-primary border-brand-secondary mt-16 border-t-4">
      <div className="container mx-auto flex justify-center px-4 py-4 empty:hidden">
        <AdSlot placement="footer" />
      </div>

      {(categories.length > 0 || recentPosts.length > 0) && (
        <div className="container mx-auto grid gap-8 px-4 pt-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <h2 className="text-primary-foreground tracking-eyebrow mb-3 text-xs font-semibold uppercase">
              Secciones
            </h2>
            <ul className="space-y-2">
              <li>
                <Link href="/blog" className={linkClass}>
                  Todas las publicaciones
                </Link>
              </li>
              {categories.map((category) => (
                <li key={category.id}>
                  <Link href={`/category/${category.slug}`} className={linkClass}>
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {recentPosts.length > 0 && (
            <div className="lg:col-span-2">
              <h2 className="text-primary-foreground tracking-eyebrow mb-3 text-xs font-semibold uppercase">
                Últimas notas
              </h2>
              <ul className="space-y-2">
                {recentPosts.map((post) => (
                  <li key={post.id}>
                    <Link href={`/blog/${post.slug}`} className={linkClass}>
                      {post.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <nav
        aria-label="Enlaces legales"
        className="container mx-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 pt-8"
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
}
