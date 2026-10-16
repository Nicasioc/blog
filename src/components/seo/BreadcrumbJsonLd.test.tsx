import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { BreadcrumbJsonLd } from './BreadcrumbJsonLd'

const MALICIOUS = 'x</script><script>alert(1)</script>'

describe('BreadcrumbJsonLd', () => {
  it('escapes < so a name cannot close the script tag', () => {
    const { container } = render(<BreadcrumbJsonLd items={[{ name: MALICIOUS, url: '/blog' }]} />)

    const script = container.querySelector('script[type="application/ld+json"]')
    const raw = script?.innerHTML ?? ''
    expect(raw).not.toContain('<')
    expect(JSON.parse(raw).itemListElement[0].name).toBe(MALICIOUS)
  })
})
