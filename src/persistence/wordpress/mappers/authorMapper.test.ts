import { describe, it, expect } from 'vitest'
import { mapWpAuthorToAuthor } from '@/persistence/wordpress/mappers/authorMapper'
import type { WpAuthorDto } from '@/persistence/wordpress/types/wpAuthor.dto'

const baseDto: WpAuthorDto = {
  id: 1,
  slug: 'john-doe',
  name: 'John Doe',
  description: 'A writer',
  link: 'https://example.com/author/john-doe',
  avatar_urls: { '96': 'https://gravatar.com/96.jpg', '48': 'https://gravatar.com/48.jpg' },
}

describe('mapWpAuthorToAuthor', () => {
  it('maps scalar fields directly', () => {
    const author = mapWpAuthorToAuthor(baseDto)
    expect(author.id).toBe(1)
    expect(author.slug).toBe('john-doe')
    expect(author.name).toBe('John Doe')
    expect(author.description).toBe('A writer')
    expect(author.profileUrl).toBe('https://example.com/author/john-doe')
  })

  it('prefers 96px avatar over 48px', () => {
    const author = mapWpAuthorToAuthor(baseDto)
    expect(author.avatarUrl).toBe('https://gravatar.com/96.jpg')
  })

  it('falls back to 48px avatar when 96px is absent', () => {
    const dto: WpAuthorDto = { ...baseDto, avatar_urls: { '48': 'https://gravatar.com/48.jpg' } }
    const author = mapWpAuthorToAuthor(dto)
    expect(author.avatarUrl).toBe('https://gravatar.com/48.jpg')
  })

  it('returns null avatarUrl when both 96px and 48px are absent', () => {
    const dto: WpAuthorDto = { ...baseDto, avatar_urls: {} }
    const author = mapWpAuthorToAuthor(dto)
    expect(author.avatarUrl).toBeNull()
  })
})
