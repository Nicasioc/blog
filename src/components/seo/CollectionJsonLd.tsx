import { buildCollectionPageJsonLd } from '@/domain/seo/buildCollectionPageJsonLd'
import { siteConfig } from '@/lib/siteConfig'
import type { Category } from '@/domain/category/category.model'
import type { Post } from '@/domain/post/post.model'

type Props = {
  category: Category
  posts: Post[]
  page: number
  perPage: number
}

export const CollectionJsonLd = ({ category, posts, page, perPage }: Props) => {
  const jsonLd = buildCollectionPageJsonLd({
    category,
    posts,
    page,
    perPage,
    siteUrl: siteConfig.siteUrl,
    siteName: siteConfig.siteName,
  })

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
