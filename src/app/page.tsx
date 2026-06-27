import { getHomepageData } from '@/application/blog/getHomepageData'
import { Sidebar } from '@/components/layout/Sidebar'
import { PostCard } from '@/components/post/PostCard'
import { PostList } from '@/components/post/PostList'

export const revalidate = 1800

export default async function HomePage() {
  const { featuredPost, recentPosts, categories } = await getHomepageData()
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
        <div className="space-y-8">
          {featuredPost && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-secondary border-l-4 border-brand-secondary pl-2 mb-3">
                Featured
              </h2>
              <PostCard post={featuredPost} />
            </section>
          )}
          <section>
            <h2 className="text-xl font-bold mb-4">Latest Posts</h2>
            <PostList posts={recentPosts} />
          </section>
        </div>
        <Sidebar categories={categories} />
      </div>
    </div>
  )
}
