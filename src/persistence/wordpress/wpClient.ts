import { serverEnv } from '@/lib/env'
import { logger } from '@/utils/logger'
import { WpApiError } from '@/persistence/wordpress/wpError'

export type WpFetchResult<T> = {
  data: T
  totalItems: number
  totalPages: number
}

type WpFetchOptions = {
  params?: Record<string, string | number | boolean | undefined>
  tags?: string[]
  revalidate?: number
}

export const wpFetch = async <T>(
  endpoint: string,
  options: WpFetchOptions = {},
): Promise<WpFetchResult<T>> => {
  const { params = {}, tags = [], revalidate = serverEnv.REVALIDATE_POSTS } = options

  const url = new URL(`${serverEnv.WORDPRESS_API_URL}${endpoint}`)

  url.searchParams.set('_embed', '1')

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, String(value))
    }
  })

  const response = await fetch(url.toString(), {
    next: { tags, revalidate },
  })

  if (!response.ok) {
    logger.warn('WP API request failed', { endpoint, status: response.status })
    throw new WpApiError(response.status, endpoint, `WP API error: ${response.status}`)
  }

  const data = (await response.json()) as T
  const totalItems = Number(response.headers.get('X-WP-Total') ?? '0')
  const totalPages = Number(response.headers.get('X-WP-TotalPages') ?? '1')

  return { data, totalItems, totalPages }
}
