import { describe, it, expect } from 'vitest'
import { mapWpTagToTag } from '@/persistence/wordpress/mappers/tagMapper'
import type { WpTagDto } from '@/persistence/wordpress/types/wpTag.dto'

const baseDto: WpTagDto = {
  id: 7,
  slug: 'champions-league',
  name: 'Champions League',
  description: 'UEFA Champions League coverage',
  count: 42,
  link: 'https://example.com/tag/champions-league',
}

describe('mapWpTagToTag', () => {
  it('maps all fields', () => {
    const tag = mapWpTagToTag(baseDto)
    expect(tag.id).toBe(7)
    expect(tag.slug).toBe('champions-league')
    expect(tag.name).toBe('Champions League')
    expect(tag.description).toBe('UEFA Champions League coverage')
  })

  it('maps dto.count to postCount', () => {
    const tag = mapWpTagToTag(baseDto)
    expect(tag.postCount).toBe(42)
  })

  it('maps zero count correctly', () => {
    const tag = mapWpTagToTag({ ...baseDto, count: 0 })
    expect(tag.postCount).toBe(0)
  })
})
