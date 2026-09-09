import { fetchAllCategories } from '@/persistence/payload/repositories/categoryRepository'
import type { Category } from '@/domain/category/category.model'

export type SidebarData = {
  categories: Category[]
}

/**
 * Data for the shared <Sidebar>, used by every post/archive route. The category
 * list is a site-wide internal-linking hub — every page linking to every
 * `/category/*` URL keeps those archives well-connected for crawlers.
 *
 * `fetchAllCategories` is cached under the `categories` tag and deduped by the
 * Next fetch cache, so calling this per route adds no real load.
 */
export const getSidebarData = async (): Promise<SidebarData> => {
  const categories = await fetchAllCategories()
  return { categories }
}
