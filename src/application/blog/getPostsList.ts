import { fetchPostsList } from '@/persistence/wordpress/repositories/postRepository'
import type { Post } from '@/domain/post/post.model'
import type { PaginationInfo } from '@/domain/shared/pagination.model'

export type PostsListData = {
  posts: Post[]
  pagination: PaginationInfo
}

type GetPostsListParams = {
  page?: number
  perPage?: number
  categoryId?: number
  tagId?: number
}

export const getPostsList = async (params: GetPostsListParams = {}): Promise<PostsListData> => {
  const { page = 1, perPage = 10, categoryId, tagId } = params

  const result = await fetchPostsList({ page, perPage, categoryId, tagId })

  return {
    posts: result.posts,
    pagination: {
      currentPage: page,
      totalPages: result.totalPages,
      totalItems: result.totalItems,
      perPage,
    },
  }
}
