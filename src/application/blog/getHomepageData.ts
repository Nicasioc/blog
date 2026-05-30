import { fetchPostsList } from '@/persistence/wordpress/repositories/postRepository'
import { fetchAllCategories } from '@/persistence/wordpress/repositories/categoryRepository'
import type { Post } from '@/domain/post/post.model'
import type { Category } from '@/domain/category/category.model'

const HOMEPAGE_POST_COUNT = 7

export type HomepageData = {
  featuredPost: Post | null
  recentPosts: Post[]
  categories: Category[]
}

export const getHomepageData = async (): Promise<HomepageData> => {
  const [postsResult, categories] = await Promise.all([
    fetchPostsList({ perPage: HOMEPAGE_POST_COUNT }),
    fetchAllCategories(),
  ])

  const [featuredPost = null, ...recentPosts] = postsResult.posts

  return { featuredPost, recentPosts, categories }
}
