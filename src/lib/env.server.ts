import 'server-only'
import { z } from 'zod'

const serverSchema = z.object({
  WORDPRESS_API_URL: z.string().url(),
  WORDPRESS_CATEGORY_ID: z.coerce.number().optional(),
  WORDPRESS_TAG_ID: z.coerce.number().optional(),
  // Payload CMS (BLO-76): additive alongside WORDPRESS_* — the full swap is BLO-78.
  PAYLOAD_API_URL: z.string().url(),
  PAYLOAD_TENANT_SLUG: z.string().min(1),
  PAYLOAD_API_KEY: z.string().min(1).optional(),
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
