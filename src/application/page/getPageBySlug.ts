import { fetchPageBySlug } from '@/persistence/wordpress/repositories/pageRepository'
import type { WpPage } from '@/domain/page/page.model'

export const getPageBySlug = async (slug: string): Promise<WpPage | null> => {
  return fetchPageBySlug(slug)
}
