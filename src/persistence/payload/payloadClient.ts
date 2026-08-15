import { serverEnv } from '@/lib/env.server'
import { logger } from '@/utils/logger'
import { PayloadApiError } from '@/persistence/payload/payloadError'

export type PayloadFetchResult<T> = {
  data: T[]
  totalItems: number
  totalPages: number
}

export type WhereClause = Record<string, Record<string, string | number | boolean>>

type PayloadFetchOptions = {
  where?: WhereClause
  depth?: number
  limit?: number
  page?: number
  select?: string[]
  tags?: string[]
  revalidate?: number
  // Every content collection is tenant-scoped by default — this is what closes the
  // cross-tenant read leak. Only the tenant lookup itself (resolveTenantId, below)
  // opts out, to avoid resolving its own scope recursively.
  scopeToTenant?: boolean
  // The Tenants collection is not publicly readable (it holds revalidateSecret), unlike
  // every content collection — so resolving a tenant slug to an id needs credentials.
  // Content reads stay unauthenticated, matching Payload's public-read access control.
  authenticated?: boolean
}

type PayloadListResponse<T> = {
  docs: T[]
  totalDocs: number
  totalPages: number
}

type PayloadTenantDto = { id: number }

const TENANT_CACHE_TAG = 'tenant'

export const resolveTenantId = async (): Promise<number> => {
  const result = await payloadFetch<PayloadTenantDto>('/tenants', {
    where: { slug: { equals: serverEnv.PAYLOAD_TENANT_SLUG } },
    limit: 1,
    depth: 0,
    tags: [TENANT_CACHE_TAG],
    revalidate: serverEnv.REVALIDATE_PAGES,
    scopeToTenant: false,
    authenticated: true,
  })

  const tenant = result.data[0]
  if (!tenant) {
    throw new Error(`No Payload tenant found for slug "${serverEnv.PAYLOAD_TENANT_SLUG}"`)
  }
  return tenant.id
}

export const payloadFetch = async <T>(
  endpoint: string,
  options: PayloadFetchOptions = {},
): Promise<PayloadFetchResult<T>> => {
  const {
    where = {},
    depth = 2,
    limit,
    page,
    select = [],
    tags = [],
    revalidate = serverEnv.REVALIDATE_POSTS,
    scopeToTenant = true,
    authenticated = false,
  } = options

  const effectiveWhere: WhereClause = scopeToTenant
    ? { ...where, tenant: { equals: await resolveTenantId() } }
    : where

  const url = new URL(`${serverEnv.PAYLOAD_API_URL}${endpoint}`)
  url.searchParams.set('depth', String(depth))
  if (limit !== undefined) url.searchParams.set('limit', String(limit))
  if (page !== undefined) url.searchParams.set('page', String(page))

  Object.entries(effectiveWhere).forEach(([field, conditions]) => {
    Object.entries(conditions).forEach(([operator, value]) => {
      url.searchParams.set(`where[${field}][${operator}]`, String(value))
    })
  })

  select.forEach((field) => url.searchParams.set(`select[${field}]`, 'true'))

  const response = await fetch(url.toString(), {
    headers: authenticated
      ? { Authorization: `users API-Key ${serverEnv.PAYLOAD_API_KEY}` }
      : undefined,
    next: { tags, revalidate },
  })

  if (!response.ok) {
    logger.warn('Payload API request failed', { endpoint, status: response.status })
    throw new PayloadApiError(response.status, endpoint, `Payload API error: ${response.status}`)
  }

  const body = (await response.json()) as PayloadListResponse<T>

  return {
    data: body.docs,
    totalItems: body.totalDocs,
    totalPages: body.totalPages,
  }
}
