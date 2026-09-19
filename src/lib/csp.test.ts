import { describe, it, expect } from 'vitest'
import { buildCsp } from '@/lib/csp'

const directivesOf = (csp: string): Record<string, string[]> =>
  Object.fromEntries(
    csp.split('; ').map((directive) => {
      const [name, ...values] = directive.split(' ')
      return [name, values]
    }),
  )

describe('buildCsp', () => {
  it('keeps default-src, style-src, img-src, and font-src unchanged from the pre-BLO-195 baseline', () => {
    const {
      'default-src': defaultSrc,
      'style-src': styleSrc,
      'img-src': imgSrc,
      'font-src': fontSrc,
    } = directivesOf(buildCsp(false))

    expect(defaultSrc).toEqual(["'self'"])
    expect(styleSrc).toEqual(["'self'", "'unsafe-inline'"])
    expect(imgSrc).toEqual(["'self'", 'data:', 'https:'])
    expect(fontSrc).toEqual(["'self'"])
  })

  it('scopes connect-src to self plus AdSense/sodar hosts, wildcarding adtrafficquality', () => {
    const { 'connect-src': connectSrc } = directivesOf(buildCsp(false))

    expect(connectSrc).toEqual([
      "'self'",
      'https://pagead2.googlesyndication.com',
      'https://googleads.g.doubleclick.net',
      'https://*.adtrafficquality.google',
      'https://*.google.com',
      'https://*.googlesyndication.com',
    ])
  })

  it('adds the adtrafficquality wildcard and google.com to frame-src alongside the existing ad hosts', () => {
    const { 'frame-src': frameSrc } = directivesOf(buildCsp(false))

    expect(frameSrc).toEqual([
      'https://googleads.g.doubleclick.net',
      'https://tpc.googlesyndication.com',
      'https://*.adtrafficquality.google',
      'https://www.google.com',
    ])
  })

  it('adds the adtrafficquality wildcard and googletagservices to script-src without dropping the existing hosts', () => {
    const { 'script-src': scriptSrc } = directivesOf(buildCsp(false))

    expect(scriptSrc).toEqual([
      "'self'",
      "'unsafe-inline'",
      'https://pagead2.googlesyndication.com',
      'https://partner.googleadservices.com',
      'https://tpc.googlesyndication.com',
      'https://*.adtrafficquality.google',
      'https://www.googletagservices.com',
    ])
  })

  it('does not add fundingchoicesmessages.google.com to script-src (out of scope for BLO-195)', () => {
    const { 'script-src': scriptSrc } = directivesOf(buildCsp(false))
    expect(scriptSrc).not.toContain('https://fundingchoicesmessages.google.com')
  })

  it('includes unsafe-eval in script-src only in development', () => {
    expect(directivesOf(buildCsp(true))['script-src']).toContain("'unsafe-eval'")
    expect(directivesOf(buildCsp(false))['script-src']).not.toContain("'unsafe-eval'")
  })

  it("keeps 'self' on every directive that requires it", () => {
    const directives = directivesOf(buildCsp(false))
    expect(directives['default-src']).toContain("'self'")
    expect(directives['style-src']).toContain("'self'")
    expect(directives['img-src']).toContain("'self'")
    expect(directives['font-src']).toContain("'self'")
    expect(directives['connect-src']).toContain("'self'")
  })

  it('has no wildcard host outside the Google allow-list', () => {
    const csp = buildCsp(false)
    const wildcards = csp.match(/https:\/\/\*\.[a-z.-]+/g) ?? []
    expect(wildcards.length).toBeGreaterThan(0)
    for (const wildcard of wildcards) {
      expect(wildcard).toMatch(
        /^https:\/\/\*\.(google\.com|googlesyndication\.com|adtrafficquality\.google)$/,
      )
    }
  })
})
