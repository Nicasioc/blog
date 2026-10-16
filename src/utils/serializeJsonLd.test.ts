import { describe, expect, it } from 'vitest'
import { serializeJsonLd } from './serializeJsonLd'

describe('serializeJsonLd', () => {
  it('leaves no literal < for </script> and <!--', () => {
    const output = serializeJsonLd({ name: 'x</script><script>alert(1)</script><!--' })

    expect(output).not.toContain('<')
    expect(output).toContain('\\u003c/script>')
  })

  it('round-trips back to the original value', () => {
    const value = { headline: 'x</script><b>y', nested: { a: ['<', '&', '"'] } }

    expect(JSON.parse(serializeJsonLd(value))).toEqual(value)
  })

  it('escapes U+2028 and U+2029', () => {
    const value = { text: 'a\u2028b\u2029c' }
    const output = serializeJsonLd(value)

    expect(output).not.toContain('\u2028')
    expect(output).not.toContain('\u2029')
    expect(output).toContain('\\u2028')
    expect(output).toContain('\\u2029')
    expect(JSON.parse(output)).toEqual(value)
  })

  it('round-trips numbers, booleans, nulls, nested objects and arrays', () => {
    const value = {
      n: 1.5,
      ok: true,
      none: null,
      list: [1, 'two', { three: 3 }],
      deep: { a: { b: [] } },
    }

    expect(JSON.parse(serializeJsonLd(value))).toEqual(value)
  })

  it('handles empty values', () => {
    expect(serializeJsonLd({})).toBe('{}')
    expect(serializeJsonLd([])).toBe('[]')
    expect(serializeJsonLd('')).toBe('""')
  })
})
