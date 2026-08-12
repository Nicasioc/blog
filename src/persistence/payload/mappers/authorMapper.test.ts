import { describe, it, expect } from 'vitest'
import { mapPayloadAuthorToAuthor } from '@/persistence/payload/mappers/authorMapper'
import type { PayloadAuthorDto } from '@/persistence/payload/types/payloadAuthor.dto'

const baseDto: PayloadAuthorDto = {
  id: 1,
  slug: 'john-doe',
  name: 'John Doe',
  description: 'Bio',
}

describe('mapPayloadAuthorToAuthor', () => {
  it('maps basic fields', () => {
    const author = mapPayloadAuthorToAuthor(baseDto)
    expect(author).toMatchObject({ id: 1, slug: 'john-doe', name: 'John Doe', description: 'Bio' })
  })

  it('falls back to empty description when missing', () => {
    const author = mapPayloadAuthorToAuthor({ ...baseDto, description: undefined })
    expect(author.description).toBe('')
  })

  it('extracts avatarUrl from a populated avatar', () => {
    const author = mapPayloadAuthorToAuthor({
      ...baseDto,
      avatar: { id: 5, alt: 'avatar', url: 'https://example.com/avatar.jpg' },
    })
    expect(author.avatarUrl).toBe('https://example.com/avatar.jpg')
  })

  it('returns null avatarUrl when avatar is an unpopulated id', () => {
    const author = mapPayloadAuthorToAuthor({ ...baseDto, avatar: 5 })
    expect(author.avatarUrl).toBeNull()
  })

  it('returns null avatarUrl when avatar is absent', () => {
    const author = mapPayloadAuthorToAuthor(baseDto)
    expect(author.avatarUrl).toBeNull()
  })

  it('always maps profileUrl to an empty string (no Payload equivalent)', () => {
    const author = mapPayloadAuthorToAuthor(baseDto)
    expect(author.profileUrl).toBe('')
  })
})
