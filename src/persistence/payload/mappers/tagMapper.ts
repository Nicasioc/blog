import type { PayloadTagDto } from '@/persistence/payload/types/payloadTag.dto'
import type { Tag } from '@/domain/tag/tag.model'

export const mapPayloadTagToTag = (dto: PayloadTagDto): Tag => ({
  id: dto.id,
  slug: dto.slug,
  name: dto.name,
  description: dto.description ?? '',
  // Payload has no built-in post-count field (unlike WP) and nothing in this app
  // reads Tag.postCount today — see BLO-76 plan decision 3.
  postCount: 0,
})
