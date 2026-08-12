import { describe, it, expect } from 'vitest'
import { mapPayloadTagToTag } from '@/persistence/payload/mappers/tagMapper'
import type { PayloadTagDto } from '@/persistence/payload/types/payloadTag.dto'

const baseDto: PayloadTagDto = {
  id: 3,
  slug: 'champions-league',
  name: 'Champions League',
  description: 'European club competition',
}

describe('mapPayloadTagToTag', () => {
  it('maps basic fields', () => {
    const tag = mapPayloadTagToTag(baseDto)
    expect(tag).toMatchObject({ id: 3, slug: 'champions-league', name: 'Champions League' })
  })

  it('falls back to empty description when missing', () => {
    const tag = mapPayloadTagToTag({ ...baseDto, description: undefined })
    expect(tag.description).toBe('')
  })

  it('hardcodes postCount to 0 (no count field in Payload)', () => {
    const tag = mapPayloadTagToTag(baseDto)
    expect(tag.postCount).toBe(0)
  })
})
