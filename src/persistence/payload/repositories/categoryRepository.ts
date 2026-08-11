import { payloadFetch } from '@/persistence/payload/payloadClient'
import { mapPayloadCategoryToCategory } from '@/persistence/payload/mappers/categoryMapper'
import type { PayloadCategoryDto } from '@/persistence/payload/types/payloadCategory.dto'
import type { Category } from '@/domain/category/category.model'

export const fetchCategoryBySlug = async (slug: string): Promise<Category | null> => {
  const result = await payloadFetch<PayloadCategoryDto>('/categories', {
    where: { slug: { equals: slug } },
    limit: 1,
    tags: ['categories'],
  })
  const dto = result.data[0]
  return dto ? mapPayloadCategoryToCategory(dto) : null
}

// Tenant-scoped by payloadFetch, unlike WP's fetchAllCategories which had no tenant
// filtering at all — this is the cross-tenant leak fix the project description calls out.
export const fetchAllCategories = async (): Promise<Category[]> => {
  const result = await payloadFetch<PayloadCategoryDto>('/categories', {
    limit: 100,
    tags: ['categories'],
  })
  return result.data.map(mapPayloadCategoryToCategory)
}
