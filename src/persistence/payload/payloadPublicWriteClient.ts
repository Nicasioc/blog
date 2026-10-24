import { serverEnv } from '@/lib/env.server'
import { logger } from '@/utils/logger'
import { PayloadApiError } from '@/persistence/payload/payloadError'
import { resolveTenantId } from '@/persistence/payload/payloadClient'

// Unauthenticated create. The CMS only exposes public create access (comments), so the
// blog's API key is deliberately not sent — it is reserved for the tenant lookup.
export const payloadPublicCreate = async (
  endpoint: string,
  body: Record<string, unknown>,
): Promise<void> => {
  const tenantId = await resolveTenantId()
  const url = new URL(`${serverEnv.PAYLOAD_API_URL}${endpoint}`)

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, tenant: tenantId }),
  })

  if (!response.ok) {
    logger.warn('Payload API write failed', { endpoint, status: response.status })
    throw new PayloadApiError(response.status, endpoint, `Payload API error: ${response.status}`)
  }
}
