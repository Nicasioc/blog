import { getHomepageData } from '@/application/blog/getHomepageData'
import { Sidebar } from '@/components/layout/Sidebar'
import { SectionHeading } from '@/components/layout/SectionHeading'
import { PostCard } from '@/components/post/PostCard'
import { PostList } from '@/components/post/PostList'

export const revalidate = 1800

export default async function HomePage() {
  const { featuredPost, recentPosts, categories } = await getHomepageData()
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-12">
        <div className="min-w-0 space-y-12">
          {featuredPost && (
            <section>
              <SectionHeading eyebrow="Featured" title="Editor's pick" />
              <PostCard post={featuredPost} featured />
            </section>
          )}
          <section>
            <SectionHeading eyebrow="Fresh off the press" title="Latest posts" />
            <PostList posts={recentPosts} />
          </section>
        </div>
        <Sidebar categories={categories} />
      </div>
    </div>
  )
}
