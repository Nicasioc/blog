import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTagArchive } from '@/application/blog/getTagArchive'
import { generateTagMetadata } from '@/domain/seo/metadata.utils'
import { siteConfig } from '@/lib/siteConfig'
import { clientEnv } from '@/lib/env.client'
import { Sidebar } from '@/components/layout/Sidebar'
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

  const siteUrl = clientEnv.NEXT_PUBLIC_SITE_URL

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
        <div>
          <Breadcrumb items={[{ name: 'Home', href: '/' }, { name: data.tag.name }]} />
          <h1 className="text-3xl font-bold mt-4 mb-6">{data.tag.name}</h1>
          <PostList posts={data.posts} />
          <Pagination pagination={data.pagination} basePath={`/tag/${slug}`} />
        </div>
        <Sidebar categories={[]} />
      </div>
    </div>
  )
}
