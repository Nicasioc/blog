import { getHomepageData } from '@/application/blog/getHomepageData'
import { Sidebar } from '@/components/layout/Sidebar'
import { PostCard } from '@/components/post/PostCard'
import { PostList } from '@/components/post/PostList'

export const revalidate = 1800

export default async function HomePage() {
  const { featuredPost, recentPosts, categories } = await getHomepageData()
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-8">
          {featuredPost && (
            <section>
              <h2 className="text-brand-secondary border-brand-secondary mb-3 border-l-4 pl-2 text-sm font-semibold tracking-wide uppercase">
                Featured
              </h2>
              <PostCard post={featuredPost} />
            </section>
          )}
          <section>
            <h2 className="mb-4 text-xl font-bold">Latest Posts</h2>
            <PostList posts={recentPosts} />
          </section>
        </div>
        <Sidebar categories={categories} />
      </div>
    </div>
  )
}
