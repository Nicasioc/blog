import { describe, it, expect } from 'vitest'
import { buildNavLinks } from './navLinks'

describe('buildNavLinks', () => {
  it('returns only internal links when forumUrl is undefined', () => {
    expect(buildNavLinks(undefined)).toEqual([
      { label: 'Inicio', href: '/', external: false },
      { label: 'Noticias', href: '/blog', external: false },
    ])
  })

  it('omits the forum link when forumUrl is empty or whitespace', () => {
    expect(buildNavLinks('').map((link) => link.label)).toEqual(['Inicio', 'Noticias'])
    expect(buildNavLinks('   ').map((link) => link.label)).toEqual(['Inicio', 'Noticias'])
  })

  it('omits the forum link when forumUrl is not a string at runtime', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(buildNavLinks(null as any).map((link) => link.label)).toEqual(['Inicio', 'Noticias'])
  })

  it('appends an external Foro link last when forumUrl is set', () => {
    const links = buildNavLinks('https://foro.example.com')
    expect(links.map((link) => link.label)).toEqual(['Inicio', 'Noticias', 'Foro'])
    expect(links[2]).toEqual({ label: 'Foro', href: 'https://foro.example.com', external: true })
  })

  it('returns a fresh array on every call', () => {
    const first = buildNavLinks(undefined)
    first.push({ label: 'X', href: '/x', external: false })
    expect(buildNavLinks(undefined)).toHaveLength(2)
  })
})
