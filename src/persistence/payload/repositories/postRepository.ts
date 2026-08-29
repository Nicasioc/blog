import { payloadFetch } from '@/persistence/payload/payloadClient'
import { payloadMutate } from '@/persistence/payload/payloadWriteClient'
import { mapPayloadPostToPost } from '@/persistence/payload/mappers/postMapper'
import type { PayloadPostDto } from '@/persistence/payload/types/payloadPost.dto'
import type { PayloadPostWriteDto } from '@/persistence/payload/types/payloadPostWrite.dto'
import type { WhereClause } from '@/persistence/payload/payloadClient'
import type { Post } from '@/domain/post/post.model'
import { clientEnv } from '@/lib/env.client'
import { serverEnv } from '@/lib/env.server'

type PostsListParams = {
  page?: number
  perPage?: number
  categoryId?: number
  tagId?: number
  featured?: boolean
}

export type PostsListResult = {
  posts: Post[]
  totalItems: number
  totalPages: number
}

// Payload's default order is createdAt, not publishedAt — "latest" should mean
// latest by publish date, not by the order rows happened to be inserted.
const POSTS_SORT = '-publishedAt'

// categoryId/tagId are archive-page filters (e.g. getCategoryArchive.ts), not tenant
// scoping — a tenant's content is isolated automatically by payloadFetch's tenant
// filter (PAYLOAD_TENANT_SLUG), so these are never defaulted from env.
const buildPostsWhere = ({
  categoryId,
  tagId,
  featured,
}: {
  categoryId?: number
  tagId?: number
  featured?: boolean
}) => {
  const where: WhereClause = { _status: { equals: 'published' } }
  if (categoryId !== undefined) where.categories = { in: String(categoryId) }
  if (tagId !== undefined) where.tags = { in: String(tagId) }
  if (featured === true) where.featured = { equals: true }
  return where
}

export const fetchPostsList = async (params: PostsListParams = {}): Promise<PostsListResult> => {
  const { page = 1, perPage = 10, categoryId, tagId, featured } = params

  const result = await payloadFetch<PayloadPostDto>('/posts', {
    where: buildPostsWhere({ categoryId, tagId, featured }),
    page,
    limit: perPage,
    sort: POSTS_SORT,
    tags: ['posts'],
    revalidate: serverEnv.REVALIDATE_POSTS,
  })

  return {
    posts: result.data.map((dto) => mapPayloadPostToPost(dto, clientEnv.NEXT_PUBLIC_SITE_URL)),
    totalItems: result.totalItems,
    totalPages: result.totalPages,
  }
}

export const fetchPostBySlug = async (slug: string): Promise<Post | null> => {
  const result = await payloadFetch<PayloadPostDto>('/posts', {
    where: { slug: { equals: slug }, _status: { equals: 'published' } },
    limit: 1,
    tags: ['posts', `post-${slug}`],
    revalidate: serverEnv.REVALIDATE_POSTS,
  })

  const dto = result.data[0]
  return dto ? mapPayloadPostToPost(dto, clientEnv.NEXT_PUBLIC_SITE_URL) : null
}

export const fetchRelatedPosts = async (
  categoryIds: number[],
  excludeId: number,
): Promise<Post[]> => {
  if (categoryIds.length === 0) return []

  const result = await payloadFetch<PayloadPostDto>('/posts', {
    where: {
      categories: { in: categoryIds.join(',') },
      id: { not_equals: excludeId },
      _status: { equals: 'published' },
    },
    limit: 3,
    sort: POSTS_SORT,
    tags: ['posts'],
    revalidate: serverEnv.REVALIDATE_POSTS,
  })

  return result.data.map((dto) => mapPayloadPostToPost(dto, clientEnv.NEXT_PUBLIC_SITE_URL))
}

export const fetchAllPostSlugs = async (): Promise<Array<{ slug: string }>> => {
  const fetchPage = (page: number) =>
    payloadFetch<PayloadPostDto>('/posts', {
      where: { _status: { equals: 'published' } },
      limit: 100,
      page,
      select: ['slug'],
      tags: ['posts'],
      revalidate: serverEnv.REVALIDATE_PAGES,
    })

  const firstPage = await fetchPage(1)

  if (firstPage.totalPages <= 1) {
    return firstPage.data.map(({ slug }) => ({ slug }))
  }

  const remainingPages = Array.from({ length: firstPage.totalPages - 1 }, (_, i) => i + 2)
  const rest = await Promise.all(remainingPages.map(fetchPage))

  return [
    ...firstPage.data.map(({ slug }) => ({ slug })),
    ...rest.flatMap((r) => r.data.map(({ slug }) => ({ slug }))),
  ]
}

export const createPost = async (input: PayloadPostWriteDto): Promise<Post> => {
  const dto = await payloadMutate<PayloadPostDto>('/posts', {
    method: 'POST',
    body: input,
  })
  return mapPayloadPostToPost(dto, clientEnv.NEXT_PUBLIC_SITE_URL)
}
