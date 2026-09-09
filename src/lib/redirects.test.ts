import { describe, it, expect } from 'vitest'
import { permanentRedirects } from '@/lib/redirects'

describe('permanentRedirects', () => {
  it('are all permanent (308) with distinct source and destination', () => {
    for (const rule of permanentRedirects) {
      expect(rule.permanent).toBe(true)
      expect(rule.source).not.toBe(rule.destination)
      expect(rule.source.startsWith('/')).toBe(true)
      expect(rule.destination.startsWith('/')).toBe(true)
    }
  })

  it('redirects the capitalised Institucionales category to its lowercase slug', () => {
    const rule = permanentRedirects.find((r) => r.source === '/category/Institucionales')
    expect(rule).toEqual({
      source: '/category/Institucionales',
      destination: '/category/institucionales',
      permanent: true,
    })
  })

  it('has no duplicate sources', () => {
    const sources = permanentRedirects.map((r) => r.source)
    expect(new Set(sources).size).toBe(sources.length)
  })
})
