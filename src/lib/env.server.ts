import 'server-only'
import { z } from 'zod'

const serverSchema = z.object({
  WORDPRESS_API_URL: z.string().url(),
  WORDPRESS_CATEGORY_ID: z.coerce.number().optional(),
  WORDPRESS_TAG_ID: z.coerce.number().optional(),
  REVALIDATE_POSTS: z.coerce.number().default(3600),
  REVALIDATE_PAGES: z.coerce.number().default(86400),
  REVALIDATE_SECRET: z.string().min(16),
})

const _serverEnv = serverSchema.safeParse(process.env)

if (!_serverEnv.success) {
  throw new Error(`Server env validation failed:\n${_serverEnv.error.toString()}`)
}

export const serverEnv = _serverEnv.data
