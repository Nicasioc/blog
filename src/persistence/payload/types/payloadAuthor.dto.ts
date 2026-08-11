import type { PayloadMediaDto } from '@/persistence/payload/types/payloadMedia.dto'

export type PayloadAuthorDto = {
  id: number
  name: string
  slug: string
  description?: string | null
  avatar?: number | PayloadMediaDto | null
}
