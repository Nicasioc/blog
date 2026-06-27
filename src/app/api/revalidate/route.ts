import { timingSafeEqual, createHash } from 'crypto'
import { revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { serverEnv } from '@/lib/env.server'

const timingSafeCompare = (a: string, b: string): boolean => {
  const ha = createHash('sha256').update(a).digest()
  const hb = createHash('sha256').update(b).digest()
  return timingSafeEqual(ha, hb)
}

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')

  if (!secret || !timingSafeCompare(secret, serverEnv.REVALIDATE_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const slug = typeof body?.slug === 'string' ? body.slug : undefined

  if (slug) {
    revalidateTag(`post-${slug}`, { expire: serverEnv.REVALIDATE_POSTS })
  }
  revalidateTag('posts', { expire: serverEnv.REVALIDATE_POSTS })

  return NextResponse.json({ revalidated: true, slug: slug ?? 'all' })
}
