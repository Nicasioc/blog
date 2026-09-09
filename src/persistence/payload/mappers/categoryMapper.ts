import type { PayloadCategoryDto } from '@/persistence/payload/types/payloadCategory.dto'
import type { Category } from '@/domain/category/category.model'
import { parseDateOr } from '@/utils/date'

// No usable date in the payload → epoch. The sitemap layer maps epoch back to
// build time so it never emits a misleading 1970 <lastmod>.
const EPOCH = new Date(0)

export const mapPayloadCategoryToCategory = (dto: PayloadCategoryDto): Category => ({
  id: dto.id,
  slug: dto.slug,
  name: dto.name,
  description: dto.description ?? '',
  // Payload has no built-in post-count field and nothing in this app reads
  // Category.postCount today — see BLO-76 plan decision 3.
  postCount: 0,
  updatedAt: parseDateOr(dto.updatedAt, EPOCH),
})
