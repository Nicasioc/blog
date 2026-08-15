import type { PostSeo } from '@/domain/post/post.model'

export type Page = {
  id: number
  slug: string
  title: string
  content: string
  modifiedAt: Date
  seo: PostSeo | null
}
