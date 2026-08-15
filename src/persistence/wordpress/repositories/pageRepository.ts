import { wpFetch } from '@/persistence/wordpress/wpClient'
import { mapWpPageToPage } from '@/persistence/wordpress/mappers/pageMapper'
import type { WpPageDto } from '@/persistence/wordpress/types/wpPage.dto'
import type { Page } from '@/domain/page/page.model'
import { isNotFoundError } from '@/persistence/wordpress/wpError'
import { serverEnv } from '@/lib/env.server'

export const fetchPageBySlug = async (slug: string): Promise<Page | null> => {
  try {
    const result = await wpFetch<WpPageDto[]>('/wp/v2/pages', {
      params: { slug, status: 'publish' },
      tags: ['pages', `page-${slug}`],
      revalidate: serverEnv.REVALIDATE_PAGES,
    })
    const dto = result.data[0]
    return dto ? mapWpPageToPage(dto) : null
  } catch (error) {
    if (isNotFoundError(error)) return null
    throw error
  }
}

export const fetchAllPageSlugs = async (): Promise<Array<{ slug: string }>> => {
  const result = await wpFetch<WpPageDto[]>('/wp/v2/pages', {
    params: { per_page: 100, status: 'publish', _fields: 'slug' },
    tags: ['pages'],
    revalidate: serverEnv.REVALIDATE_PAGES,
  })
  return result.data.map(({ slug }) => ({ slug }))
}
