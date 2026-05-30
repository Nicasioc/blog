import { revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { serverEnv } from '@/lib/env'

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')

  if (secret !== serverEnv.REVALIDATE_SECRET) {
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
