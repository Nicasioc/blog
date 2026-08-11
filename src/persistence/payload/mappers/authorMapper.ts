import type { PayloadAuthorDto } from '@/persistence/payload/types/payloadAuthor.dto'
import type { PayloadMediaDto } from '@/persistence/payload/types/payloadMedia.dto'
import type { Author } from '@/domain/author/author.model'
import { isNonEmptyObject } from '@/utils/checks'

const extractAvatarUrl = (avatar: PayloadAuthorDto['avatar']): string | null => {
  if (!isNonEmptyObject(avatar)) return null
  return (avatar as PayloadMediaDto).url ?? null
}

export const mapPayloadAuthorToAuthor = (dto: PayloadAuthorDto): Author => ({
  id: dto.id,
  slug: dto.slug,
  name: dto.name,
  description: dto.description ?? '',
  avatarUrl: extractAvatarUrl(dto.avatar),
  // Payload has no public author-profile URL equivalent to WP's `link`, and nothing
  // in this app reads Author.profileUrl today — see BLO-76 plan decision 4.
  profileUrl: '',
})
