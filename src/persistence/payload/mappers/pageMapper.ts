import type { PayloadPageDto } from '@/persistence/payload/types/payloadPage.dto'
import type { PayloadMediaDto } from '@/persistence/payload/types/payloadMedia.dto'
import type { WpPage } from '@/domain/page/page.model'
import type { PostSeo } from '@/domain/post/post.model'
import { isNonEmptyObject } from '@/utils/checks'

const extractSeoImageUrl = (image?: number | PayloadMediaDto | null): string | null => {
  if (!isNonEmptyObject(image)) return null
  return (image as PayloadMediaDto).url ?? null
}

const extractSeo = (dto: PayloadPageDto): PostSeo | null => {
  const meta = dto.meta
  if (!meta?.title && !meta?.description) return null
  return {
    metaTitle: meta?.title ?? '',
    metaDescription: meta?.description ?? '',
    ogImage: extractSeoImageUrl(meta?.image),
  }
}

export const mapPayloadPageToPage = (dto: PayloadPageDto): WpPage => ({
  id: dto.id,
  slug: dto.slug,
  title: dto.title,
  content: dto.contentHtml,
  modifiedAt: new Date(dto.updatedAt),
  seo: extractSeo(dto),
})
