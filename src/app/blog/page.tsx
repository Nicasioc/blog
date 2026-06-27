import type { Metadata } from 'next'
import { getPostsList } from '@/application/blog/getPostsList'
import { siteConfig } from '@/lib/siteConfig'
import { Sidebar } from '@/components/layout/Sidebar'
import { PostList } from '@/components/post/PostList'
import { Pagination } from '@/components/navigation/Pagination'

export const revalidate = 1800

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Blog', description: `Latest posts from ${siteConfig.siteName}` }
}

type Props = { searchParams: Promise<{ page?: string }> }

export default async function BlogPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam ?? '1'))
  const data = await getPostsList({ page })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
        <div>
          <h1 className="mb-6 text-3xl font-bold">Latest Posts</h1>
          <PostList posts={data.posts} />
          <Pagination pagination={data.pagination} basePath="/blog" />
        </div>
        <Sidebar categories={[]} />
      </div>
    </div>
  )
}
