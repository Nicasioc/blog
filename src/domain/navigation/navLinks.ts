import { isNonEmptyString } from '@/utils/checks'

export type NavLink = {
  label: string
  href: string
  external: boolean
}

const BASE_NAV_LINKS: NavLink[] = [
  { label: 'Inicio', href: '/', external: false },
  { label: 'Noticias', href: '/blog', external: false },
]

export const buildNavLinks = (forumUrl: string | undefined): NavLink[] =>
  isNonEmptyString(forumUrl)
    ? [...BASE_NAV_LINKS, { label: 'Foro', href: forumUrl, external: true }]
    : [...BASE_NAV_LINKS]
