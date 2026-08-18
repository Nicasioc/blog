export type StaticPage = {
  href: string
  title: string
}

export const PRIVACY_PAGE: StaticPage = { href: '/privacy', title: 'Política de Privacidad' }
export const TERMS_PAGE: StaticPage = { href: '/terms', title: 'Términos y Condiciones' }
export const CONTACT_PAGE: StaticPage = { href: '/contact', title: 'Contacto' }
export const ABOUT_PAGE: StaticPage = { href: '/about', title: 'Sobre Nosotros' }

/**
 * Legal and informational pages required by third-party ad networks.
 * Single source of truth for the footer links and the sitemap so both stay in sync.
 */
export const STATIC_PAGES: readonly StaticPage[] = [
  PRIVACY_PAGE,
  TERMS_PAGE,
  CONTACT_PAGE,
  ABOUT_PAGE,
]
