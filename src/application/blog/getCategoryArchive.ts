import { fetchCategoryBySlug } from '@/persistence/payload/repositories/categoryRepository'
import { fetchPostsList } from '@/persistence/payload/repositories/postRepository'
import type { Category } from '@/domain/category/category.model'
import type { Post } from '@/domain/post/post.model'
import { ARCHIVE_PAGE_SIZE } from '@/domain/shared/pagination.model'
import type { PaginationInfo } from '@/domain/shared/pagination.model'

export type CategoryArchiveData = {
  category: Category
  posts: Post[]
  pagination: PaginationInfo
}

type GetCategoryArchiveParams = {
  slug: string
  page?: number
  perPage?: number
}

export const getCategoryArchive = async (
  params: GetCategoryArchiveParams,
): Promise<CategoryArchiveData | null> => {
  const { slug, page = 1, perPage = ARCHIVE_PAGE_SIZE } = params

  const category = await fetchCategoryBySlug(slug)
  if (!category) return null

  const result = await fetchPostsList({ categoryId: category.id, page, perPage })

  return {
    category,
    posts: result.posts,
    pagination: {
      currentPage: page,
      totalPages: result.totalPages,
      totalItems: result.totalItems,
      perPage,
    },
  }
}
