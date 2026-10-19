import type { Metadata } from 'next'
import Link from 'next/link'
import { getHomepageData } from '@/application/blog/getHomepageData'
import { getLatestForumTopics } from '@/application/forum/getLatestForumTopics'
import { buildCanonicalUrl } from '@/domain/seo/metadata.utils'
import { siteConfig } from '@/lib/siteConfig'
import { Sidebar } from '@/components/layout/Sidebar'
import { SectionHeading } from '@/components/layout/SectionHeading'
import { PostList } from '@/components/post/PostList'
import { HeroCarousel } from '@/components/home/HeroCarousel'
import { LatestForumTopics } from '@/components/forum/LatestForumTopics'

export const revalidate = 1800

export const metadata: Metadata = {
  alternates: { canonical: buildCanonicalUrl(siteConfig.siteUrl, '/') },
}

export default async function HomePage() {
  const [{ heroPosts, recentPosts, categories }, forumTopics] = await Promise.all([
    getHomepageData(),
    getLatestForumTopics(siteConfig.forumUrl),
  ])
  return (
    <>
      {heroPosts.length > 0 && <HeroCarousel posts={heroPosts} />}
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-12">
          <div className="min-w-0 space-y-12">
            <section>
              <SectionHeading title="Más Noticias" />
              <PostList posts={recentPosts} />
              <Link
                href="/blog"
                className="text-primary hover:text-brand-secondary mt-6 inline-block text-sm font-semibold transition-colors"
              >
                Ver todas las publicaciones &rarr;
              </Link>
            </section>
            {siteConfig.forumUrl && (
              <LatestForumTopics topics={forumTopics} forumUrl={siteConfig.forumUrl} />
            )}
          </div>
          <Sidebar categories={categories} />
        </div>
      </div>
    </>
  )
}
