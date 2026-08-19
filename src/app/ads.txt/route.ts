import { NextResponse } from 'next/server'
import { siteConfig } from '@/lib/siteConfig'
import { buildAdsTxtContent } from '@/domain/ads/adsTxt.utils'

export function GET() {
  const content = buildAdsTxtContent(siteConfig.adSensePublisherId)

  if (!content) {
    return new NextResponse(null, { status: 404 })
  }

  return new NextResponse(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
