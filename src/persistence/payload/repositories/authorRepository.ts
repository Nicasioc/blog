import { payloadFetch } from '@/persistence/payload/payloadClient'
import { mapPayloadAuthorToAuthor } from '@/persistence/payload/mappers/authorMapper'
import type { PayloadAuthorDto } from '@/persistence/payload/types/payloadAuthor.dto'
import type { Author } from '@/domain/author/author.model'

export const fetchAuthorById = async (id: number): Promise<Author | null> => {
  const result = await payloadFetch<PayloadAuthorDto>('/authors', {
    where: { id: { equals: id } },
    limit: 1,
    tags: ['authors'],
  })
  const dto = result.data[0]
  return dto ? mapPayloadAuthorToAuthor(dto) : null
}

export const fetchAuthorBySlug = async (slug: string): Promise<Author | null> => {
  const result = await payloadFetch<PayloadAuthorDto>('/authors', {
    where: { slug: { equals: slug } },
    limit: 1,
    tags: ['authors'],
  })
  const dto = result.data[0]
  return dto ? mapPayloadAuthorToAuthor(dto) : null
}
