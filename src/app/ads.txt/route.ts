import { NextResponse } from 'next/server'
import { siteConfig } from '@/lib/siteConfig'
import { serverEnv } from '@/lib/env.server'
import { buildAdsTxtContent, parseAdsTxtExtraLines } from '@/domain/ads/adsTxt.utils'

export function GET() {
  const content = buildAdsTxtContent(
    siteConfig.ads.adSensePublisherId,
    parseAdsTxtExtraLines(serverEnv.ADS_TXT_EXTRA_LINES),
  )

  if (!content) {
    return new NextResponse(null, { status: 404 })
  }

  return new NextResponse(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
