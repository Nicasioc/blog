import type { WpCategoryDto } from '@/persistence/wordpress/types/wpCategory.dto'
import type { Category } from '@/domain/category/category.model'

export const mapWpCategoryToCategory = (dto: WpCategoryDto): Category => ({
  id: dto.id,
  slug: dto.slug,
  name: dto.name,
  description: dto.description,
  postCount: dto.count,
})
