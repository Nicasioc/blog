import type { WpYoastHeadDto } from './wpPost.dto'

export type WpPageDto = {
  id: number
  slug: string
  status: 'publish' | 'draft' | 'private'
  modified_gmt: string
  title: { rendered: string }
  content: { rendered: string }
  link: string
  yoast_head_json?: WpYoastHeadDto
}
