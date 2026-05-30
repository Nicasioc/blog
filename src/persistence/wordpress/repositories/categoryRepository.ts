import { wpFetch } from '@/persistence/wordpress/wpClient'
import { mapWpCategoryToCategory } from '@/persistence/wordpress/mappers/categoryMapper'
import type { WpCategoryDto } from '@/persistence/wordpress/types/wpCategory.dto'
import type { Category } from '@/domain/category/category.model'
import { isNotFoundError } from '@/persistence/wordpress/wpError'
import { serverEnv } from '@/lib/env'

export const fetchCategoryBySlug = async (slug: string): Promise<Category | null> => {
  try {
    const result = await wpFetch<WpCategoryDto[]>('/wp/v2/categories', {
      params: { slug },
      tags: ['categories'],
      revalidate: serverEnv.REVALIDATE_PAGES,
    })
    const dto = result.data[0]
    return dto ? mapWpCategoryToCategory(dto) : null
  } catch (error) {
    if (isNotFoundError(error)) return null
    throw error
  }
}

export const fetchAllCategories = async (): Promise<Category[]> => {
  const result = await wpFetch<WpCategoryDto[]>('/wp/v2/categories', {
    params: { per_page: 100, hide_empty: true },
    tags: ['categories'],
    revalidate: serverEnv.REVALIDATE_PAGES,
  })
  return result.data.map(mapWpCategoryToCategory)
}
