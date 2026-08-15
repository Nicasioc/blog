import { fetchPageBySlug } from '@/persistence/payload/repositories/pageRepository'
import type { Page } from '@/domain/page/page.model'

export const getPageBySlug = async (slug: string): Promise<Page | null> => {
  return fetchPageBySlug(slug)
}
