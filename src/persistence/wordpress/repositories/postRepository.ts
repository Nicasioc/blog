import { wpFetch } from '@/persistence/wordpress/wpClient'
import { mapWpPostToPost } from '@/persistence/wordpress/mappers/postMapper'
import type { WpPostDto } from '@/persistence/wordpress/types/wpPost.dto'
import type { Post } from '@/domain/post/post.model'
import { isNotFoundError } from '@/persistence/wordpress/wpError'
import { clientEnv, serverEnv } from '@/lib/env'

type PostsListParams = {
  page?: number
  perPage?: number
  categoryId?: number
  tagId?: number
}

export type PostsListResult = {
  posts: Post[]
  totalItems: number
  totalPages: number
}

export const fetchPostsList = async (params: PostsListParams = {}): Promise<PostsListResult> => {
  const { page = 1, perPage = 10, categoryId, tagId } = params

  const result = await wpFetch<WpPostDto[]>('/wp/v2/posts', {
    params: {
      page,
      per_page: perPage,
      categories: categoryId,
      tags: tagId,
      status: 'publish',
    },
    tags: ['posts'],
    revalidate: serverEnv.REVALIDATE_POSTS,
  })

  return {
    posts: result.data.map((dto) => mapWpPostToPost(dto, clientEnv.NEXT_PUBLIC_SITE_URL)),
    totalItems: result.totalItems,
    totalPages: result.totalPages,
  }
}

export const fetchPostBySlug = async (slug: string): Promise<Post | null> => {
  try {
    const result = await wpFetch<WpPostDto[]>('/wp/v2/posts', {
      params: { slug, status: 'publish' },
      tags: ['posts', `post-${slug}`],
      revalidate: serverEnv.REVALIDATE_POSTS,
    })

    const dto = result.data[0]
    if (!dto) return null

    return mapWpPostToPost(dto, clientEnv.NEXT_PUBLIC_SITE_URL)
  } catch (error) {
    if (isNotFoundError(error)) return null
    throw error
  }
}

export const fetchRelatedPosts = async (
  categoryIds: number[],
  excludeId: number,
): Promise<Post[]> => {
  if (categoryIds.length === 0) return []

  const result = await wpFetch<WpPostDto[]>('/wp/v2/posts', {
    params: {
      categories: categoryIds.join(','),
      exclude: excludeId,
      per_page: 3,
      status: 'publish',
    },
    tags: ['posts'],
    revalidate: serverEnv.REVALIDATE_POSTS,
  })

  return result.data.map((dto) => mapWpPostToPost(dto, clientEnv.NEXT_PUBLIC_SITE_URL))
}

export const fetchAllPostSlugs = async (): Promise<Array<{ slug: string }>> => {
  const firstPage = await wpFetch<WpPostDto[]>('/wp/v2/posts', {
    params: { per_page: 100, page: 1, status: 'publish', _fields: 'slug' },
    tags: ['posts'],
    revalidate: serverEnv.REVALIDATE_PAGES,
  })

  if (firstPage.totalPages <= 1) {
    return firstPage.data.map(({ slug }) => ({ slug }))
  }

  const remainingPages = Array.from({ length: firstPage.totalPages - 1 }, (_, i) => i + 2)
  const rest = await Promise.all(
    remainingPages.map((page) =>
      wpFetch<WpPostDto[]>('/wp/v2/posts', {
        params: { per_page: 100, page, status: 'publish', _fields: 'slug' },
        tags: ['posts'],
        revalidate: serverEnv.REVALIDATE_PAGES,
      }),
    ),
  )

  return [
    ...firstPage.data.map(({ slug }) => ({ slug })),
    ...rest.flatMap((r) => r.data.map(({ slug }) => ({ slug }))),
  ]
}
