import type { WpTagDto } from '@/persistence/wordpress/types/wpTag.dto'
import type { Tag } from '@/domain/tag/tag.model'

export const mapWpTagToTag = (dto: WpTagDto): Tag => ({
  id: dto.id,
  slug: dto.slug,
  name: dto.name,
  description: dto.description,
  postCount: dto.count,
})
