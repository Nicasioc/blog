import { wpFetch } from '@/persistence/wordpress/wpClient'
import { mapWpTagToTag } from '@/persistence/wordpress/mappers/tagMapper'
import type { WpTagDto } from '@/persistence/wordpress/types/wpTag.dto'
import type { Tag } from '@/domain/tag/tag.model'
import { isNotFoundError } from '@/persistence/wordpress/wpError'
import { serverEnv } from '@/lib/env.server'

export const fetchTagBySlug = async (slug: string): Promise<Tag | null> => {
  try {
    const result = await wpFetch<WpTagDto[]>('/wp/v2/tags', {
      params: { slug },
      tags: ['tags'],
      revalidate: serverEnv.REVALIDATE_PAGES,
    })
    const dto = result.data[0]
    return dto ? mapWpTagToTag(dto) : null
  } catch (error) {
    if (isNotFoundError(error)) return null
    throw error
  }
}
