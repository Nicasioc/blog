import { serverEnv } from '@/lib/env.server'
import { logger } from '@/utils/logger'
import { PayloadApiError } from '@/persistence/payload/payloadError'
import { resolveTenantId } from '@/persistence/payload/payloadClient'

type PayloadMutateOptions = {
  method: 'POST' | 'PATCH'
  body: Record<string, unknown>
}

type PayloadMutateResponse<T> = {
  doc: T
  message: string
}

export const payloadMutate = async <T>(
  endpoint: string,
  { method, body }: PayloadMutateOptions,
): Promise<T> => {
  if (!serverEnv.PAYLOAD_API_KEY) {
    throw new Error('PAYLOAD_API_KEY is required to perform authenticated Payload writes')
  }

  const tenantId = await resolveTenantId()
  const url = new URL(`${serverEnv.PAYLOAD_API_URL}${endpoint}`)

  const response = await fetch(url.toString(), {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `users API-Key ${serverEnv.PAYLOAD_API_KEY}`,
    },
    body: JSON.stringify({ ...body, tenant: tenantId }),
  })

  if (!response.ok) {
    logger.warn('Payload API write failed', { endpoint, status: response.status })
    throw new PayloadApiError(response.status, endpoint, `Payload API error: ${response.status}`)
  }

  const result = (await response.json()) as PayloadMutateResponse<T>
  return result.doc
}
