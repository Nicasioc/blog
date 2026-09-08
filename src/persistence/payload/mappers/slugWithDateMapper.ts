import { parseDateOr } from '@/utils/date'

/** A published entry's slug plus its last-modified date, for the sitemap. */
export type SlugWithDate = {
  slug: string
  updatedAt: Date
}

type SluggedDto = {
  slug: string
  updatedAt?: string | null
}

// No usable date in the payload → epoch. The sitemap maps epoch back to build
// time so it never emits a misleading 1970 <lastmod>.
const EPOCH = new Date(0)

export const toSlugWithDate = (dto: SluggedDto): SlugWithDate => ({
  slug: dto.slug,
  updatedAt: parseDateOr(dto.updatedAt, EPOCH),
})
