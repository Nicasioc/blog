import { fetchTagBySlug } from '@/persistence/wordpress/repositories/tagRepository'
import { fetchPostsList } from '@/persistence/wordpress/repositories/postRepository'
import type { Tag } from '@/domain/tag/tag.model'
import type { Post } from '@/domain/post/post.model'
import type { PaginationInfo } from '@/domain/shared/pagination.model'

export type TagArchiveData = {
  tag: Tag
  posts: Post[]
  pagination: PaginationInfo
}

type GetTagArchiveParams = {
  slug: string
  page?: number
  perPage?: number
}

export const getTagArchive = async (
  params: GetTagArchiveParams,
): Promise<TagArchiveData | null> => {
  const { slug, page = 1, perPage = 10 } = params

  const tag = await fetchTagBySlug(slug)
  if (!tag) return null

  const result = await fetchPostsList({ tagId: tag.id, page, perPage })

  return {
    tag,
    posts: result.posts,
    pagination: {
      currentPage: page,
      totalPages: result.totalPages,
      totalItems: result.totalItems,
      perPage,
    },
  }
}
