import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPageBySlug } from '@/application/page/getPageBySlug'
import { fetchAllPageSlugs } from '@/persistence/wordpress/repositories/pageRepository'
import { generatePageMetadata } from '@/domain/seo/metadata.utils'
import { siteConfig } from '@/lib/siteConfig'
import { ContentHtml } from '@/components/post/ContentHtml'

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

export default async function WpStaticPage({ params }: Props) {
  const { slug } = await params
  const page = await getPageBySlug(slug)
  if (!page) notFound()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{page.title}</h1>
      <div className="prose prose-lg max-w-none">
        <ContentHtml html={page.content} />
      </div>
    </div>
  )
}
