import type { PayloadPostDto } from '@/persistence/payload/types/payloadPost.dto'
import type { PayloadAuthorDto } from '@/persistence/payload/types/payloadAuthor.dto'
import type { PayloadCategoryDto } from '@/persistence/payload/types/payloadCategory.dto'
import type { PayloadTagDto } from '@/persistence/payload/types/payloadTag.dto'
import type { PayloadMediaDto } from '@/persistence/payload/types/payloadMedia.dto'
import type { Post, FeaturedImage, PostSeo } from '@/domain/post/post.model'
import type { Author } from '@/domain/author/author.model'
import type { Category } from '@/domain/category/category.model'
import type { Tag } from '@/domain/tag/tag.model'
import { mapPayloadAuthorToAuthor } from '@/persistence/payload/mappers/authorMapper'
import { mapPayloadCategoryToCategory } from '@/persistence/payload/mappers/categoryMapper'
import { mapPayloadTagToTag } from '@/persistence/payload/mappers/tagMapper'
import { isNonEmptyObject, isNonEmptyArray } from '@/utils/checks'

const extractFeaturedImage = (dto: PayloadPostDto): FeaturedImage | null => {
  if (!isNonEmptyObject(dto.featuredImage)) return null
  const media = dto.featuredImage as PayloadMediaDto
  if (!media.url) return null

  return {
    url: media.url,
    alt: media.alt || '',
    width: media.width ?? 0,
    height: media.height ?? 0,
  }
}

const extractAuthor = (dto: PayloadPostDto): Author => {
  if (isNonEmptyObject(dto.author)) {
    return mapPayloadAuthorToAuthor(dto.author as PayloadAuthorDto)
  }

  return {
    id: typeof dto.author === 'number' ? dto.author : 0,
    slug: '',
    name: 'Desconocido',
    description: '',
    avatarUrl: null,
    profileUrl: '',
  }
}

const extractCategories = (dto: PayloadPostDto): Category[] => {
  if (!isNonEmptyArray<unknown>(dto.categories)) return []
  return dto.categories
    .filter(isNonEmptyObject)
    .map((category) => mapPayloadCategoryToCategory(category as PayloadCategoryDto))
}

const extractTags = (dto: PayloadPostDto): Tag[] => {
  if (!isNonEmptyArray<unknown>(dto.tags)) return []
  return dto.tags.filter(isNonEmptyObject).map((tag) => mapPayloadTagToTag(tag as PayloadTagDto))
}

const extractSeoImageUrl = (image?: number | PayloadMediaDto | null): string | null => {
  if (!isNonEmptyObject(image)) return null
  return (image as PayloadMediaDto).url ?? null
}

const extractSeo = (dto: PayloadPostDto): PostSeo | null => {
  const meta = dto.meta
  if (!meta?.title && !meta?.description) return null
  return {
    metaTitle: meta?.title ?? '',
    metaDescription: meta?.description ?? '',
    ogImage: extractSeoImageUrl(meta?.image),
  }
}

export const mapPayloadPostToPost = (dto: PayloadPostDto, siteUrl: string): Post => ({
  id: dto.id,
  slug: dto.slug,
  title: dto.title,
  excerpt: dto.excerpt ?? '',
  content: dto.contentHtml,
  publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : new Date(dto.updatedAt),
  modifiedAt: new Date(dto.updatedAt),
  // dto.featured is undefined on posts created before the field existed and may be
  // null from the database — both must coerce to false, not leak through.
  featured: dto.featured === true,
  featuredImage: extractFeaturedImage(dto),
  author: extractAuthor(dto),
  categories: extractCategories(dto),
  tags: extractTags(dto),
  canonicalUrl: `${siteUrl}/blog/${dto.slug}`,
  seo: extractSeo(dto),
})
