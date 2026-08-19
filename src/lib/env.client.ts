import { z } from 'zod'

const clientSchema = z.object({
  NEXT_PUBLIC_SITE_NAME: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXT_PUBLIC_SITE_LOGO_URL: z.string().min(1),
  NEXT_PUBLIC_CONTACT_EMAIL: z.string().email(),
  NEXT_PUBLIC_PRIMARY_COLOR: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  NEXT_PUBLIC_SECONDARY_COLOR: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  NEXT_PUBLIC_PRIMARY_FOREGROUND: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default('#ffffff'),
  NEXT_PUBLIC_AD_PROVIDER: z.enum(['adsense', 'gam', 'prebid']).default('adsense'),
  NEXT_PUBLIC_ADSENSE_PUBLISHER_ID: z.string().startsWith('ca-pub-').optional(),
  NEXT_PUBLIC_ADSENSE_SLOT_HEADER: z.string().optional().default(''),
  NEXT_PUBLIC_ADSENSE_SLOT_IN_CONTENT: z.string().optional().default(''),
  NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR: z.string().optional().default(''),
  NEXT_PUBLIC_ADSENSE_SLOT_FOOTER: z.string().optional().default(''),
})

const _clientEnv = clientSchema.safeParse({
  NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SITE_LOGO_URL: process.env.NEXT_PUBLIC_SITE_LOGO_URL,
  NEXT_PUBLIC_CONTACT_EMAIL: process.env.NEXT_PUBLIC_CONTACT_EMAIL,
  NEXT_PUBLIC_PRIMARY_COLOR: process.env.NEXT_PUBLIC_PRIMARY_COLOR,
  NEXT_PUBLIC_SECONDARY_COLOR: process.env.NEXT_PUBLIC_SECONDARY_COLOR,
  NEXT_PUBLIC_PRIMARY_FOREGROUND: process.env.NEXT_PUBLIC_PRIMARY_FOREGROUND,
  NEXT_PUBLIC_AD_PROVIDER: process.env.NEXT_PUBLIC_AD_PROVIDER,
  NEXT_PUBLIC_ADSENSE_PUBLISHER_ID: process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID,
  NEXT_PUBLIC_ADSENSE_SLOT_HEADER: process.env.NEXT_PUBLIC_ADSENSE_SLOT_HEADER,
  NEXT_PUBLIC_ADSENSE_SLOT_IN_CONTENT: process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_CONTENT,
  NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR,
  NEXT_PUBLIC_ADSENSE_SLOT_FOOTER: process.env.NEXT_PUBLIC_ADSENSE_SLOT_FOOTER,
})

if (!_clientEnv.success) {
  throw new Error(`Client env validation failed:\n${_clientEnv.error.toString()}`)
}

export const clientEnv = _clientEnv.data
