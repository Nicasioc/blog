import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPostBySlug } from '@/application/blog/getPostBySlug'
import { fetchAllPostSlugs } from '@/persistence/payload/repositories/postRepository'
import { generatePostMetadata } from '@/domain/seo/metadata.utils'
import { formatPostDateLong } from '@/domain/post/postDate.utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
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
          { name: 'Inicio', url: siteUrl },
          { name: 'Blog', url: `${siteUrl}/blog` },
          { name: post.title, url: post.canonicalUrl },
        ]}
      />
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-12">
          <article className="min-w-0">
            <Breadcrumb
              items={[
                { name: 'Inicio', href: '/' },
                { name: 'Blog', href: '/blog' },
                { name: post.title },
              ]}
            />
            <header className="mt-6 mb-8">
              {post.categories.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {post.categories.map((cat) => (
                    <Badge key={cat.id} render={<Link href={`/category/${cat.slug}`} />}>
                      {cat.name}
                    </Badge>
                  ))}
                </div>
              )}
              <h1 className="text-3xl leading-tight font-bold tracking-tight text-balance sm:text-4xl">
                {post.title}
              </h1>
              <div className="text-muted-foreground mt-5 flex items-center gap-3 text-sm">
                <Avatar size="sm">
                  {post.author.avatarUrl && (
                    <AvatarImage src={post.author.avatarUrl} alt={post.author.name} />
                  )}
                  <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span>
                  <span className="text-foreground font-medium">{post.author.name}</span>
                  <span className="mx-1.5">&middot;</span>
                  <time dateTime={post.publishedAt.toISOString()}>
                    {formatPostDateLong(post.publishedAt)}
                  </time>
                </span>
              </div>
            </header>
            {post.featuredImage && (
              <Image
                src={post.featuredImage.url}
                alt={post.featuredImage.alt}
                width={post.featuredImage.width}
                height={post.featuredImage.height}
                sizes="(min-width: 1024px) 66vw, 100vw"
                className="ring-foreground/10 mb-10 w-full rounded-xl ring-1"
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
