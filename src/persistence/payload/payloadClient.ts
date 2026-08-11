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
}

type PayloadListResponse<T> = {
  docs: T[]
  totalDocs: number
  totalPages: number
}

type PayloadTenantDto = { id: number }

const TENANT_CACHE_TAG = 'tenant'

export const resolveTenantId = async (): Promise<number> => {
  const tenantSlug = serverEnv.PAYLOAD_TENANT_SLUG
  if (!tenantSlug) {
    throw new Error('PAYLOAD_TENANT_SLUG is required to use the Payload persistence layer')
  }

  const result = await payloadFetch<PayloadTenantDto>('/tenants', {
    where: { slug: { equals: tenantSlug } },
    limit: 1,
    depth: 0,
    tags: [TENANT_CACHE_TAG],
    revalidate: serverEnv.REVALIDATE_PAGES,
    scopeToTenant: false,
  })

  const tenant = result.data[0]
  if (!tenant) {
    throw new Error(`No Payload tenant found for slug "${tenantSlug}"`)
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
  } = options

  const apiUrl = serverEnv.PAYLOAD_API_URL
  if (!apiUrl) {
    throw new Error('PAYLOAD_API_URL is required to use the Payload persistence layer')
  }

  const effectiveWhere: WhereClause = scopeToTenant
    ? { ...where, tenant: { equals: await resolveTenantId() } }
    : where

  const url = new URL(`${apiUrl}${endpoint}`)
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
