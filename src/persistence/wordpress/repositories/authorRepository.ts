import { wpFetch } from '@/persistence/wordpress/wpClient'
import { mapWpAuthorToAuthor } from '@/persistence/wordpress/mappers/authorMapper'
import type { WpAuthorDto } from '@/persistence/wordpress/types/wpAuthor.dto'
import type { Author } from '@/domain/author/author.model'
import { isNotFoundError } from '@/persistence/wordpress/wpError'

export const fetchAuthorById = async (id: number): Promise<Author | null> => {
  try {
    const result = await wpFetch<WpAuthorDto>(`/wp/v2/users/${id}`, {
      tags: ['authors'],
    })
    return mapWpAuthorToAuthor(result.data)
  } catch (error) {
    if (isNotFoundError(error)) return null
    throw error
  }
}
