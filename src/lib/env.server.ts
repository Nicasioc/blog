import 'server-only'
import { z } from 'zod'

const serverSchema = z.object({
  // Payload CMS REST API base (must end in `/api`).
  PAYLOAD_API_URL: z.string().url(),
  // Tenant slug — every read and write is scoped to this tenant.
  PAYLOAD_TENANT_SLUG: z.string().min(1),
  // Required, not just for writes — every read resolves PAYLOAD_TENANT_SLUG to a
  // numeric id via the Tenants collection, which isn't publicly readable (it holds
  // revalidateSecret), so that lookup needs credentials too.
  PAYLOAD_API_KEY: z.string().min(1),
  REVALIDATE_POSTS: z.coerce.number().default(3600),
  REVALIDATE_PAGES: z.coerce.number().default(86400),
  REVALIDATE_SECRET: z.string().min(16),
  SITE_FAVICON_URL: z.string().min(1).optional(),
  SITE_APPLE_TOUCH_ICON_URL: z.string().min(1).optional(),
  SITE_ICON_192_URL: z.string().min(1).optional(),
  SITE_ICON_512_URL: z.string().min(1).optional(),
})

const _serverEnv = serverSchema.safeParse(process.env)

if (!_serverEnv.success) {
  throw new Error(`Server env validation failed:\n${_serverEnv.error.toString()}`)
}

export const serverEnv = _serverEnv.data
