import type { WpAuthorDto } from '@/persistence/wordpress/types/wpAuthor.dto'
import type { Author } from '@/domain/author/author.model'

export const mapWpAuthorToAuthor = (dto: WpAuthorDto): Author => ({
  id: dto.id,
  slug: dto.slug,
  name: dto.name,
  description: dto.description,
  avatarUrl: dto.avatar_urls['96'] ?? dto.avatar_urls['48'] ?? null,
  profileUrl: dto.link,
})
