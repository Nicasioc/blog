import type { WpPageDto } from '@/persistence/wordpress/types/wpPage.dto'
import type { Page } from '@/domain/page/page.model'
import type { PostSeo } from '@/domain/post/post.model'

const extractPageSeo = (dto: WpPageDto): PostSeo | null => {
  const yoast = dto.yoast_head_json
  if (!yoast?.title && !yoast?.description) return null
  return {
    metaTitle: yoast?.title ?? '',
    metaDescription: yoast?.description ?? '',
    ogImage: yoast?.og_image?.[0]?.url ?? null,
  }
}

export const mapWpPageToPage = (dto: WpPageDto): Page => ({
  id: dto.id,
  slug: dto.slug,
  title: dto.title.rendered,
  content: dto.content.rendered,
  modifiedAt: new Date(dto.modified_gmt + 'Z'),
  seo: extractPageSeo(dto),
})
