import { payloadFetch } from '@/persistence/payload/payloadClient'
import { mapPayloadTagToTag } from '@/persistence/payload/mappers/tagMapper'
import type { PayloadTagDto } from '@/persistence/payload/types/payloadTag.dto'
import type { Tag } from '@/domain/tag/tag.model'

export const fetchTagBySlug = async (slug: string): Promise<Tag | null> => {
  const result = await payloadFetch<PayloadTagDto>('/tags', {
    where: { slug: { equals: slug } },
    limit: 1,
    tags: ['tags'],
  })
  const dto = result.data[0]
  return dto ? mapPayloadTagToTag(dto) : null
}
