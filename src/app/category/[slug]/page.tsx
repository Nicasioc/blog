import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCategoryArchive } from '@/application/blog/getCategoryArchive'
import { generateCategoryMetadata } from '@/domain/seo/metadata.utils'
import { siteConfig } from '@/lib/siteConfig'
import { clientEnv } from '@/lib/env.client'
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd'
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
  const data = await getCategoryArchive({ slug })
  if (!data) return {}
  return generateCategoryMetadata(data.category, siteConfig)
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam ?? '1'))

  const data = await getCategoryArchive({ slug, page })
  if (!data) notFound()

  const siteUrl = clientEnv.NEXT_PUBLIC_SITE_URL

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: siteUrl },
          { name: data.category.name, url: `${siteUrl}/category/${slug}` },
        ]}
      />
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-12">
          <div className="min-w-0">
            <Breadcrumb items={[{ name: 'Home', href: '/' }, { name: data.category.name }]} />
            <PageHeader className="mt-6" eyebrow="Category" title={data.category.name} />
            <PostList posts={data.posts} />
            <Pagination pagination={data.pagination} basePath={`/category/${slug}`} />
          </div>
          <Sidebar categories={[]} />
        </div>
      </div>
    </>
  )
}
