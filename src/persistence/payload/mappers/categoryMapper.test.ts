import { describe, it, expect } from 'vitest'
import { mapPayloadCategoryToCategory } from '@/persistence/payload/mappers/categoryMapper'
import type { PayloadCategoryDto } from '@/persistence/payload/types/payloadCategory.dto'

const baseDto: PayloadCategoryDto = {
  id: 2,
  slug: 'football',
  name: 'Football',
  description: 'All things football',
  updatedAt: '2026-02-03T04:05:06.000Z',
}

describe('mapPayloadCategoryToCategory', () => {
  it('maps basic fields', () => {
    const category = mapPayloadCategoryToCategory(baseDto)
    expect(category).toMatchObject({ id: 2, slug: 'football', name: 'Football' })
  })

  it.each([undefined, null])('falls back to empty description when %o', (description) => {
    const category = mapPayloadCategoryToCategory({ ...baseDto, description })
    expect(category.description).toBe('')
  })

  it('hardcodes postCount to 0 (no count field in Payload)', () => {
    const category = mapPayloadCategoryToCategory(baseDto)
    expect(category.postCount).toBe(0)
  })

  it('parses updatedAt into a Date', () => {
    const category = mapPayloadCategoryToCategory(baseDto)
    expect(category.updatedAt.toISOString()).toBe('2026-02-03T04:05:06.000Z')
  })

  it.each([undefined, null, 'not-a-date'])(
    'falls back to the epoch when updatedAt is %o',
    (updatedAt) => {
      const category = mapPayloadCategoryToCategory({ ...baseDto, updatedAt } as PayloadCategoryDto)
      expect(category.updatedAt.getTime()).toBe(0)
    },
  )
})
