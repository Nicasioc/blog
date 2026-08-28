import type { Post } from '@/domain/post/post.model'
import { siteConfig } from '@/lib/siteConfig'

type Props = { post: Post }

export const PostJsonLd = ({ post }: Props) => {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt.toISOString(),
    dateModified: post.modifiedAt.toISOString(),
    author: { '@type': 'Person', name: post.author.name },
    publisher: { '@type': 'Organization', name: siteConfig.siteName },
    // JSON-LD needs an absolute URL. `featuredImage.url` is the CMS media proxy
    // path, served from this origin via the rewrite in next.config.ts.
    ...(post.featuredImage && {
      image: new URL(post.featuredImage.url, siteConfig.siteUrl).href,
    }),
    url: post.canonicalUrl,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
