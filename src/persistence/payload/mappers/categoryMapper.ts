import type { PayloadCategoryDto } from '@/persistence/payload/types/payloadCategory.dto'
import type { Category } from '@/domain/category/category.model'

export const mapPayloadCategoryToCategory = (dto: PayloadCategoryDto): Category => ({
  id: dto.id,
  slug: dto.slug,
  name: dto.name,
  description: dto.description ?? '',
  // Payload has no built-in post-count field and nothing in this app reads
  // Category.postCount today — see BLO-76 plan decision 3.
  postCount: 0,
})
