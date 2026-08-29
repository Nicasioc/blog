import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPageBySlug } from '@/application/page/getPageBySlug'
import { fetchAllPageSlugs } from '@/persistence/payload/repositories/pageRepository'
import { generatePageMetadata } from '@/domain/seo/metadata.utils'
import { siteConfig } from '@/lib/siteConfig'
import { ContentHtml } from '@/components/post/ContentHtml'
import { PageHeader } from '@/components/layout/PageHeader'

export const revalidate = 86400

export async function generateStaticParams() {
  return fetchAllPageSlugs()
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = await getPageBySlug(slug)
  if (!page) return {}
  return generatePageMetadata(page, siteConfig)
}

export default async function StaticPage({ params }: Props) {
  const { slug } = await params
  const page = await getPageBySlug(slug)
  if (!page) notFound()

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <PageHeader title={page.title} />
      <div className="prose prose-lg prose-headings:tracking-tight max-w-none">
        <ContentHtml html={page.content} />
      </div>
    </div>
  )
}
