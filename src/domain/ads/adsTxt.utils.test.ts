import { describe, it, expect } from 'vitest'
import { buildAdsTxtContent, parseAdsTxtExtraLines } from './adsTxt.utils'

const GOOGLE_LINE = 'google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0'
const GAM_LINE = 'google.com, pub-9999999999999999, DIRECT, f08c47fec0942fa0'
const PARTNER_LINE = 'appnexus.com, 12345, RESELLER, f5ab79cb980f11d1'

describe('buildAdsTxtContent', () => {
  it('returns null when no publisher id is configured', () => {
    expect(buildAdsTxtContent(undefined)).toBeNull()
  })

  it('returns null when there is no publisher id and no usable extra lines', () => {
    expect(buildAdsTxtContent(undefined, [])).toBeNull()
    expect(buildAdsTxtContent(undefined, ['', '   ', '# only a comment'])).toBeNull()
  })

  it('treats an empty publisher id as unset', () => {
    expect(buildAdsTxtContent('', [])).toBeNull()
  })

  it('strips the "ca-" prefix and formats a valid ads.txt DIRECT entry', () => {
    expect(buildAdsTxtContent('ca-pub-1234567890123456')).toBe(`${GOOGLE_LINE}\n`)
  })

  it('emits only the extra lines when no publisher id is configured', () => {
    expect(buildAdsTxtContent(undefined, [GAM_LINE, PARTNER_LINE])).toBe(
      `${GAM_LINE}\n${PARTNER_LINE}\n`,
    )
  })

  it('puts the Google line first, followed by extras in their given order', () => {
    expect(buildAdsTxtContent('ca-pub-1234567890123456', [PARTNER_LINE, GAM_LINE])).toBe(
      `${GOOGLE_LINE}\n${PARTNER_LINE}\n${GAM_LINE}\n`,
    )
  })

  it('dedupes case-insensitively and ignoring whitespace, keeping the first occurrence', () => {
    const content = buildAdsTxtContent('ca-pub-1234567890123456', [
      'GOOGLE.COM,pub-1234567890123456,  direct,F08C47FEC0942FA0',
      PARTNER_LINE,
      `  ${PARTNER_LINE.toUpperCase()}  `,
    ])

    expect(content).toBe(`${GOOGLE_LINE}\n${PARTNER_LINE}\n`)
  })

  it('dedupes a record that only differs by a trailing inline comment', () => {
    expect(buildAdsTxtContent('ca-pub-1234567890123456', [`${GOOGLE_LINE} # GAM publisher`])).toBe(
      `${GOOGLE_LINE}\n`,
    )
  })

  it('keeps an inline comment on a record that is not a duplicate', () => {
    expect(buildAdsTxtContent(undefined, [`${GAM_LINE} # GAM`])).toBe(`${GAM_LINE} # GAM\n`)
  })

  it('treats account ids as case-sensitive, so they are not deduped by case', () => {
    const lower = 'exchange.com, abc123, RESELLER'
    const mixed = 'exchange.com, AbC123, RESELLER'
    expect(buildAdsTxtContent(undefined, [lower, mixed])).toBe(`${lower}\n${mixed}\n`)
  })

  it('passes ads.txt variable lines through and dedupes them', () => {
    expect(
      buildAdsTxtContent(undefined, ['contact=ads@example.com', 'CONTACT=ads@example.com']),
    ).toBe('contact=ads@example.com\n')
  })

  it('strips comment lines, blank lines and surrounding whitespace from extras', () => {
    expect(
      buildAdsTxtContent(undefined, ['# GAM', '', `   ${GAM_LINE}   `, '   ', '#partner']),
    ).toBe(`${GAM_LINE}\n`)
  })

  it('does not mutate the extra lines array', () => {
    const extras = [`  ${GAM_LINE}  `, '# comment']
    buildAdsTxtContent('ca-pub-1234567890123456', extras)
    expect(extras).toEqual([`  ${GAM_LINE}  `, '# comment'])
  })
})

describe('parseAdsTxtExtraLines', () => {
  it.each([undefined, '', '   ', '|', '\n\n'])('returns [] for an empty value (%j)', (raw) => {
    expect(parseAdsTxtExtraLines(raw)).toEqual([])
  })

  it('trims whitespace around separators and drops a trailing separator', () => {
    expect(parseAdsTxtExtraLines(` ${GAM_LINE} | ${PARTNER_LINE} |`)).toEqual([
      GAM_LINE,
      PARTNER_LINE,
    ])
  })

  it('handles "|" and newlines mixed in one value', () => {
    expect(parseAdsTxtExtraLines(`${GAM_LINE}|${PARTNER_LINE}\n${GOOGLE_LINE}`)).toEqual([
      GAM_LINE,
      PARTNER_LINE,
      GOOGLE_LINE,
    ])
  })

  it('splits on "|" for single-line env values', () => {
    expect(parseAdsTxtExtraLines(`${GAM_LINE}|${PARTNER_LINE}`)).toEqual([GAM_LINE, PARTNER_LINE])
  })

  it('splits on LF and CRLF newlines for multi-line env values', () => {
    expect(parseAdsTxtExtraLines(`${GAM_LINE}\n${PARTNER_LINE}\r\n# end`)).toEqual([
      GAM_LINE,
      PARTNER_LINE,
      '# end',
    ])
  })
})
