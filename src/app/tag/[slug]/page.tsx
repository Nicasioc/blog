import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTagArchive } from '@/application/blog/getTagArchive'
import { generateTagMetadata } from '@/domain/seo/metadata.utils'
import { siteConfig } from '@/lib/siteConfig'
import { Sidebar } from '@/components/layout/Sidebar'
import { PageHeader } from '@/components/layout/PageHeader'
import { PostList } from '@/components/post/PostList'
import { Breadcrumb } from '@/components/navigation/Breadcrumb'
import { Pagination } from '@/components/navigation/Pagination'

export const revalidate = 3600

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const data = await getTagArchive({ slug })
  if (!data) return {}
  return generateTagMetadata(data.tag, siteConfig)
}

export default async function TagPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam ?? '1'))

  const data = await getTagArchive({ slug, page })
  if (!data) notFound()

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-12">
        <div className="min-w-0">
          <Breadcrumb items={[{ name: 'Inicio', href: '/' }, { name: data.tag.name }]} />
          <PageHeader className="mt-6" eyebrow="Etiqueta" title={data.tag.name} />
          <PostList posts={data.posts} />
          <Pagination pagination={data.pagination} basePath={`/tag/${slug}`} />
        </div>
        <Sidebar categories={[]} />
      </div>
    </div>
  )
}
