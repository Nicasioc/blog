import type { Category } from '@/domain/category/category.model'
import type { Post } from '@/domain/post/post.model'
import type { CollectionPageJsonLd } from '@/domain/seo/jsonLd.model'
import { isNonEmptyString } from '@/utils/checks'

type BuildParams = {
  category: Category
  posts: ReadonlyArray<Post>
  page: number
  perPage: number
  siteUrl: string
  siteName: string
}

const categoryUrl = (siteUrl: string, slug: string, page: number): string => {
  const base = `${siteUrl}/category/${slug}`
  return page > 1 ? `${base}?page=${page}` : base
}

const postUrl = (siteUrl: string, post: Post): string =>
  isNonEmptyString(post.canonicalUrl) ? post.canonicalUrl : `${siteUrl}/blog/${post.slug}`

/**
 * `CollectionPage` + `ItemList` structured data for a category archive page.
 *
 * `itemListElement` lists only the posts on the current page. `position` is
 * page-aware and continues across pages (page 2 with perPage 10 starts at 11),
 * and `url` for each item is the post's absolute canonical URL.
 */
export const buildCollectionPageJsonLd = ({
  category,
  posts,
  page,
  perPage,
  siteUrl,
  siteName,
}: BuildParams): CollectionPageJsonLd => {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1
  const safePerPage = Number.isFinite(perPage) && perPage > 0 ? Math.floor(perPage) : posts.length
  const startPosition = (safePage - 1) * safePerPage + 1

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.name,
    url: categoryUrl(siteUrl, category.slug, safePage),
    isPartOf: { '@type': 'WebSite', name: siteName, url: siteUrl },
    ...(isNonEmptyString(category.description) && { description: category.description }),
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: posts.length,
      itemListElement: posts.map((post, index) => ({
        '@type': 'ListItem',
        position: startPosition + index,
        url: postUrl(siteUrl, post),
      })),
    },
  }
}
