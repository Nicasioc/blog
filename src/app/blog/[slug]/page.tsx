import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getPostBySlug } from '@/application/blog/getPostBySlug'
import { fetchAllPostSlugs } from '@/persistence/wordpress/repositories/postRepository'
import { generatePostMetadata } from '@/domain/seo/metadata.utils'
import { siteConfig } from '@/lib/siteConfig'
import { clientEnv } from '@/lib/env.client'
import { PostJsonLd } from '@/components/seo/PostJsonLd'
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd'
import { Sidebar } from '@/components/layout/Sidebar'
import { PostBody } from '@/components/post/PostBody'
import { AuthorCard } from '@/components/post/AuthorCard'
import { RelatedPosts } from '@/components/post/RelatedPosts'
import { TagList } from '@/components/navigation/TagList'
import { Breadcrumb } from '@/components/navigation/Breadcrumb'
import { CommentList } from '@/components/post/CommentList'
import { CommentForm } from '@/components/post/CommentForm'

export const revalidate = 3600

export async function generateStaticParams() {
  return fetchAllPostSlugs()
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const result = await getPostBySlug(slug)
  if (!result) return {}
  return generatePostMetadata(result.post, siteConfig)
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params
  const result = await getPostBySlug(slug)
  if (!result) notFound()

  const { post, relatedPosts, comments } = result
  const siteUrl = clientEnv.NEXT_PUBLIC_SITE_URL

  return (
    <>
      <PostJsonLd post={post} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: siteUrl },
          { name: 'Blog', url: `${siteUrl}/blog` },
          { name: post.title, url: post.canonicalUrl },
        ]}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
          <article>
            <Breadcrumb
              items={[
                { name: 'Home', href: '/' },
                { name: 'Blog', href: '/blog' },
                { name: post.title },
              ]}
            />
            <h1 className="text-3xl font-bold mt-4 mb-2">{post.title}</h1>
            <p className="text-sm text-muted-foreground mb-6">
              {post.publishedAt.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}{' '}
              · {post.author.name}
            </p>
            {post.featuredImage && (
              <Image
                src={post.featuredImage.url}
                alt={post.featuredImage.alt}
                width={post.featuredImage.width}
                height={post.featuredImage.height}
                className="w-full rounded-lg mb-6"
                priority
              />
            )}
            <PostBody content={post.content} />
            <TagList tags={post.tags} />
            <AuthorCard author={post.author} />
            <RelatedPosts posts={relatedPosts} />
            <CommentList comments={comments} />
            <CommentForm postId={post.id} />
          </article>
          <Sidebar categories={[]} />
        </div>
      </div>
    </>
  )
}
