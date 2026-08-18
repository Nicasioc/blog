import { fetchPostsList } from '@/persistence/payload/repositories/postRepository'
import { fetchAllCategories } from '@/persistence/payload/repositories/categoryRepository'
import { selectHeroPosts } from '@/domain/post/selectHeroPosts'
import type { Post } from '@/domain/post/post.model'
import type { Category } from '@/domain/category/category.model'

const HOMEPAGE_POST_COUNT = 7
const HERO_POST_COUNT = 3

export type HomepageData = {
  heroPosts: Post[]
  recentPosts: Post[]
  categories: Category[]
}

export const getHomepageData = async (): Promise<HomepageData> => {
  const [featuredResult, postsResult, categories] = await Promise.all([
    fetchPostsList({ perPage: HERO_POST_COUNT, featured: true }),
    fetchPostsList({ perPage: HOMEPAGE_POST_COUNT }),
    fetchAllCategories(),
  ])

  const heroPosts = selectHeroPosts(featuredResult.posts, postsResult.posts, HERO_POST_COUNT)
  const heroIds = new Set(heroPosts.map((post) => post.id))
  const recentPosts = postsResult.posts.filter((post) => !heroIds.has(post.id))

  return { heroPosts, recentPosts, categories }
}
