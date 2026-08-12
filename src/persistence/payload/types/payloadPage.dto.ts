import type { PayloadSeoDto } from '@/persistence/payload/types/payloadPost.dto'

export type PayloadPageDto = {
  id: number
  title: string
  slug: string
  // See payloadPost.dto.ts's `contentHtml` note — same lexicalHTMLField() companion field.
  contentHtml: string
  meta?: PayloadSeoDto | null
  updatedAt: string
  _status?: 'draft' | 'published' | null
}
