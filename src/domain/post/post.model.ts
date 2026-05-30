import type { Author } from '@/domain/author/author.model'
import type { Category } from '@/domain/category/category.model'
import type { Tag } from '@/domain/tag/tag.model'

export type FeaturedImage = {
  url: string
  alt: string
  width: number
  height: number
}

export type PostSeo = {
  metaTitle: string
  metaDescription: string
  ogImage: string | null
}

export type Post = {
  id: number
  slug: string
  title: string
  excerpt: string
  content: string
  publishedAt: Date
  modifiedAt: Date
  featuredImage: FeaturedImage | null
  author: Author
  categories: Category[]
  tags: Tag[]
  canonicalUrl: string
  seo: PostSeo | null
}
