import type { Metadata } from 'next'
import { getPostsList } from '@/application/blog/getPostsList'
import { siteConfig } from '@/lib/siteConfig'
import { Sidebar } from '@/components/layout/Sidebar'
import { PageHeader } from '@/components/layout/PageHeader'
import { PostList } from '@/components/post/PostList'
import { Pagination } from '@/components/navigation/Pagination'

export const revalidate = 1800

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Blog', description: `Últimas publicaciones de ${siteConfig.siteName}` }
}

type Props = { searchParams: Promise<{ page?: string }> }

export default async function BlogPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam ?? '1'))
  const data = await getPostsList({ page })

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-12">
        <div className="min-w-0">
          <PageHeader
            eyebrow="Archivo"
            title="Últimas publicaciones"
            description={`Todo lo publicado en ${siteConfig.siteName}, empezando por lo más reciente.`}
          />
          <PostList posts={data.posts} />
          <Pagination pagination={data.pagination} basePath="/blog" />
        </div>
        <Sidebar categories={[]} />
      </div>
    </div>
  )
}
