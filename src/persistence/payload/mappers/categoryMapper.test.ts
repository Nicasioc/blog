import { describe, it, expect } from 'vitest'
import { mapPayloadCategoryToCategory } from '@/persistence/payload/mappers/categoryMapper'
import type { PayloadCategoryDto } from '@/persistence/payload/types/payloadCategory.dto'

const baseDto: PayloadCategoryDto = {
  id: 2,
  slug: 'football',
  name: 'Football',
  description: 'All things football',
}

describe('mapPayloadCategoryToCategory', () => {
  it('maps basic fields', () => {
    const category = mapPayloadCategoryToCategory(baseDto)
    expect(category).toMatchObject({ id: 2, slug: 'football', name: 'Football' })
  })

  it('falls back to empty description when missing', () => {
    const category = mapPayloadCategoryToCategory({ ...baseDto, description: undefined })
    expect(category.description).toBe('')
  })

  it('hardcodes postCount to 0 (no count field in Payload)', () => {
    const category = mapPayloadCategoryToCategory(baseDto)
    expect(category.postCount).toBe(0)
  })
})
