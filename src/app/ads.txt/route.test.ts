import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockAds, mockServerEnv } = vi.hoisted(() => ({
  mockAds: { adSensePublisherId: undefined as string | undefined },
  mockServerEnv: { ADS_TXT_EXTRA_LINES: undefined as string | undefined },
}))

vi.mock('@/lib/siteConfig', () => ({ siteConfig: { ads: mockAds } }))
vi.mock('@/lib/env.server', () => ({ serverEnv: mockServerEnv }))

import { GET } from './route'

const GAM_LINE = 'google.com, pub-9999999999999999, DIRECT, f08c47fec0942fa0'

describe('GET /ads.txt', () => {
  beforeEach(() => {
    mockAds.adSensePublisherId = undefined
    mockServerEnv.ADS_TXT_EXTRA_LINES = undefined
  })

  it('returns 404 when neither a publisher id nor extra lines are configured', async () => {
    const res = GET()
    expect(res.status).toBe(404)
    expect(await res.text()).toBe('')
  })

  it('serves the AdSense line merged with ADS_TXT_EXTRA_LINES as plain text', async () => {
    mockAds.adSensePublisherId = 'ca-pub-1234567890123456'
    mockServerEnv.ADS_TXT_EXTRA_LINES = `# GAM|${GAM_LINE}`

    const res = GET()

    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('text/plain; charset=utf-8')
    expect(await res.text()).toBe(
      `google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n${GAM_LINE}\n`,
    )
  })

  it('serves extra lines alone when no AdSense publisher id is set', async () => {
    mockServerEnv.ADS_TXT_EXTRA_LINES = GAM_LINE

    const res = GET()

    expect(res.status).toBe(200)
    expect(await res.text()).toBe(`${GAM_LINE}\n`)
  })
})
