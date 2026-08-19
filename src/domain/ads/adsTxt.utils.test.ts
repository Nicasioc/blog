import { describe, it, expect } from 'vitest'
import { buildAdsTxtContent } from './adsTxt.utils'

describe('buildAdsTxtContent', () => {
  it('returns null when no publisher id is configured', () => {
    expect(buildAdsTxtContent(undefined)).toBeNull()
  })

  it('strips the "ca-" prefix and formats a valid ads.txt DIRECT entry', () => {
    expect(buildAdsTxtContent('ca-pub-1234567890123456')).toBe(
      'google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n',
    )
  })
})
