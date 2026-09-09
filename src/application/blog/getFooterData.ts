import { fetchAllCategories } from '@/persistence/payload/repositories/categoryRepository'
import { fetchPostsList } from '@/persistence/payload/repositories/postRepository'
import type { Category } from '@/domain/category/category.model'
import type { Post } from '@/domain/post/post.model'

const FOOTER_RECENT_POST_COUNT = 6

export type FooterData = {
  categories: Category[]
  recentPosts: Post[]
}

/**
 * Data for the site-wide <Footer>: every category and the most recent posts.
 * These links appear on every page — including deep archive and post pages —
 * so they keep the whole site well-connected for crawlers.
 */
export const getFooterData = async (): Promise<FooterData> => {
  const [categories, recent] = await Promise.all([
    fetchAllCategories(),
    fetchPostsList({ perPage: FOOTER_RECENT_POST_COUNT }),
  ])

  return { categories, recentPosts: recent.posts }
}
