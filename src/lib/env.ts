import { z } from 'zod'

const serverSchema = z.object({
  WORDPRESS_API_URL: z.string().url(),
  REVALIDATE_POSTS: z.coerce.number().default(3600),
  REVALIDATE_PAGES: z.coerce.number().default(86400),
})

const clientSchema = z.object({
  NEXT_PUBLIC_SITE_NAME: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXT_PUBLIC_SITE_LOGO_URL: z.string().min(1),
  NEXT_PUBLIC_PRIMARY_COLOR: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  NEXT_PUBLIC_SECONDARY_COLOR: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  NEXT_PUBLIC_PRIMARY_FOREGROUND: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default('#ffffff'),
  NEXT_PUBLIC_AD_PROVIDER: z.enum(['adsense', 'gam', 'prebid']).default('adsense'),
  NEXT_PUBLIC_ADSENSE_PUBLISHER_ID: z.string().startsWith('ca-pub-').optional(),
})

const _serverEnv = serverSchema.safeParse(process.env)
const _clientEnv = clientSchema.safeParse(process.env)

if (!_serverEnv.success) {
  throw new Error(`Server env validation failed:\n${_serverEnv.error.toString()}`)
}
if (!_clientEnv.success) {
  throw new Error(`Client env validation failed:\n${_clientEnv.error.toString()}`)
}

export const serverEnv = _serverEnv.data
export const clientEnv = _clientEnv.data
