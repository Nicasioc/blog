import type { WpAuthorDto } from './wpAuthor.dto'
import type { WpMediaDto } from './wpMedia.dto'
import type { WpCategoryDto } from './wpCategory.dto'
import type { WpTagDto } from './wpTag.dto'

export type WpYoastHeadDto = {
  title?: string
  description?: string
  og_image?: Array<{ url: string }>
}

export type WpPostDto = {
  id: number
  slug: string
  status: 'publish' | 'draft' | 'private' | 'pending' | 'future'
  date_gmt: string
  modified_gmt: string
  title: { rendered: string }
  excerpt: { rendered: string }
  content: { rendered: string }
  featured_media: number
  author: number
  categories: number[]
  tags: number[]
  link: string
  yoast_head_json?: WpYoastHeadDto
  _embedded?: {
    author?: WpAuthorDto[]
    'wp:featuredmedia'?: WpMediaDto[]
    'wp:term'?: (WpCategoryDto[] | WpTagDto[])[]
  }
}
