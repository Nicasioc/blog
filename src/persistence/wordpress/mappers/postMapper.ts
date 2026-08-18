import type { WpPostDto } from '@/persistence/wordpress/types/wpPost.dto'
import type { Post, FeaturedImage, PostSeo } from '@/domain/post/post.model'
import type { Author } from '@/domain/author/author.model'
import type { Category } from '@/domain/category/category.model'
import type { Tag } from '@/domain/tag/tag.model'
import { mapWpAuthorToAuthor } from './authorMapper'
import { mapWpCategoryToCategory } from './categoryMapper'
import { mapWpTagToTag } from './tagMapper'
import { isNonEmptyArray } from '@/utils/checks'

const stripHtml = (html: string): string => html.replace(/<[^>]*>/g, '').trim()

const extractFeaturedImage = (dto: WpPostDto): FeaturedImage | null => {
  const media = dto._embedded?.['wp:featuredmedia']?.[0]
  if (!media || dto.featured_media === 0) return null

  const largeSize = media.media_details.sizes?.large
  return {
    url: largeSize?.source_url ?? media.source_url,
    alt: media.alt_text || '',
    width: largeSize?.width ?? media.media_details.width,
    height: largeSize?.height ?? media.media_details.height,
  }
}

const extractAuthor = (dto: WpPostDto): Author => {
  const embedded = dto._embedded?.author?.[0]
  if (embedded) return mapWpAuthorToAuthor(embedded)

  return {
    id: dto.author,
    slug: '',
    name: 'Desconocido',
    description: '',
    avatarUrl: null,
    profileUrl: '',
  }
}

const extractCategories = (dto: WpPostDto): Category[] => {
  const terms = dto._embedded?.['wp:term']
  if (!isNonEmptyArray(terms)) return []
  const categoryTerms = terms[0]
  if (!isNonEmptyArray<unknown>(categoryTerms)) return []
  return (categoryTerms as Parameters<typeof mapWpCategoryToCategory>[0][]).map(
    mapWpCategoryToCategory,
  )
}

const extractTags = (dto: WpPostDto): Tag[] => {
  const terms = dto._embedded?.['wp:term']
  if (!isNonEmptyArray(terms) || terms.length < 2) return []
  const tagTerms = terms[1]
  if (!isNonEmptyArray<unknown>(tagTerms)) return []
  return (tagTerms as Parameters<typeof mapWpTagToTag>[0][]).map(mapWpTagToTag)
}

const extractSeo = (dto: WpPostDto): PostSeo | null => {
  const yoast = dto.yoast_head_json
  if (!yoast) return null
  if (!yoast.title && !yoast.description) return null

  return {
    metaTitle: yoast.title ?? '',
    metaDescription: yoast.description ?? '',
    ogImage: yoast.og_image?.[0]?.url ?? null,
  }
}

export const mapWpPostToPost = (dto: WpPostDto, siteUrl: string): Post => ({
  id: dto.id,
  slug: dto.slug,
  title: dto.title.rendered,
  excerpt: stripHtml(dto.excerpt.rendered),
  content: dto.content.rendered,
  publishedAt: new Date(dto.date_gmt + 'Z'),
  modifiedAt: new Date(dto.modified_gmt + 'Z'),
  // WordPress has no editorial "featured" concept in this DTO.
  featured: false,
  featuredImage: extractFeaturedImage(dto),
  author: extractAuthor(dto),
  categories: extractCategories(dto),
  tags: extractTags(dto),
  canonicalUrl: `${siteUrl}/blog/${dto.slug}`,
  seo: extractSeo(dto),
})
