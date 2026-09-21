import { describe, expect, it } from 'vitest'
import { splitContentForAd, splitContentForAds } from './splitContentForAd'

const paragraphs = (count: number) =>
  Array.from({ length: count }, (_, i) => `<p>Paragraph ${i + 1}</p>`).join('')

const countTag = (html: string, tag: string) => (html.match(new RegExp(tag, 'g')) ?? []).length

describe('splitContentForAd', () => {
  it('returns null for content with too few paragraphs to split', () => {
    expect(splitContentForAd('<p>Only one</p>')).toBeNull()
  })

  it('returns null for empty or whitespace-only content', () => {
    expect(splitContentForAd('')).toBeNull()
    expect(splitContentForAd('   ')).toBeNull()
  })

  it('returns null for non-string input', () => {
    expect(splitContentForAd(null as unknown as string)).toBeNull()
    expect(splitContentForAd(undefined as unknown as string)).toBeNull()
    expect(splitContentForAd(42 as unknown as string)).toBeNull()
  })

  it('splits unwrapped content on paragraph boundaries', () => {
    const result = splitContentForAd(paragraphs(8))

    expect(result).not.toBeNull()
    expect(result!.before).toBe(paragraphs(3))
    expect(result!.after).toBe(
      '<p>Paragraph 4</p><p>Paragraph 5</p><p>Paragraph 6</p><p>Paragraph 7</p><p>Paragraph 8</p>',
    )
  })

  it('keeps the wrapper balanced in both halves', () => {
    const content = `<div class="payload-richtext">${paragraphs(8)}</div>`
    const result = splitContentForAd(content)

    expect(result).not.toBeNull()
    for (const half of [result!.before, result!.after]) {
      expect(countTag(half, '<div')).toBe(1)
      expect(countTag(half, '</div>')).toBe(1)
      expect(half.startsWith('<div class="payload-richtext">')).toBe(true)
      expect(half.endsWith('</div>')).toBe(true)
    }
  })

  it('preserves all paragraphs across the split', () => {
    const content = `<div class="payload-richtext">${paragraphs(8)}</div>`
    const result = splitContentForAd(content)

    expect(countTag(result!.before, '<p>') + countTag(result!.after, '<p>')).toBe(8)
  })

  it('does not treat sibling containers as a single wrapper', () => {
    const content = `<div>${paragraphs(4)}</div><div>${paragraphs(4)}</div>`
    const result = splitContentForAd(content)

    // Falls back to a raw split rather than re-wrapping with a bogus container.
    expect(result).not.toBeNull()
    expect(result!.before.startsWith('<div>')).toBe(true)
  })

  it('handles a wrapper with nested container elements', () => {
    const content = `<div class="rt"><p>A</p><div class="box"><p>B</p></div><p>C</p><p>D</p><p>E</p><p>F</p></div>`
    const result = splitContentForAd(content)

    expect(result).not.toBeNull()
    expect(countTag(result!.before, '<div')).toBe(countTag(result!.before, '</div>'))
    expect(countTag(result!.after, '<div')).toBe(countTag(result!.after, '</div>'))
  })

  it('respects a custom maximum paragraph count', () => {
    const result = splitContentForAd(paragraphs(10), 1)

    expect(result!.before).toBe('<p>Paragraph 1</p>')
  })

  it('splits at the midpoint when there are fewer paragraphs than the maximum', () => {
    const result = splitContentForAd(paragraphs(4))

    expect(result!.before).toBe('<p>Paragraph 1</p><p>Paragraph 2</p>')
  })

  it('handles content with no paragraph tags at all', () => {
    expect(splitContentForAd('<div><span>no paragraphs here</span></div>')).toBeNull()
  })
})

describe('splitContentForAds', () => {
  it('returns a single fragment (no split) for a short post', () => {
    const content = paragraphs(4)
    expect(splitContentForAds(content)).toEqual([content])
  })

  it('returns a single fragment for empty or non-string content', () => {
    expect(splitContentForAds('')).toEqual([''])
    expect(splitContentForAds(null as unknown as string)).toEqual([''])
  })

  it('returns a single fragment for content with no paragraph tags', () => {
    const content = '<div><span>no paragraphs here</span></div>'
    expect(splitContentForAds(content)).toEqual([content])
  })

  it('splits a medium post once, after the 3rd paragraph by default', () => {
    const result = splitContentForAds(paragraphs(10))

    expect(result).toHaveLength(2)
    expect(result[0]).toBe(paragraphs(3))
    expect(result[1]).toBe(
      Array.from({ length: 7 }, (_, i) => `<p>Paragraph ${i + 4}</p>`).join(''),
    )
  })

  it('caps a long post at the default max of 2 splits (3 fragments)', () => {
    const result = splitContentForAds(paragraphs(30))
    expect(result).toHaveLength(3)
  })

  it('never puts a split point inside the trailing 2 paragraphs', () => {
    // 12 paragraphs: the 2nd default split point (3 + 8 = 11) would leave
    // only 1 trailing paragraph, so it must be dropped — one split only.
    const result12 = splitContentForAds(paragraphs(12))
    expect(result12).toHaveLength(2)

    // 13 paragraphs: the 2nd split point (11) leaves exactly 2 trailing
    // paragraphs — the boundary case — so it's allowed.
    const result13 = splitContentForAds(paragraphs(13))
    expect(result13).toHaveLength(3)
    expect(result13[2]).toBe('<p>Paragraph 12</p><p>Paragraph 13</p>')
  })

  it('preserves every paragraph across all fragments (no content lost)', () => {
    const content = paragraphs(30)
    const result = splitContentForAds(content)
    expect(result.join('')).toBe(content)
  })

  it('respects custom firstAfter, everyParagraphs, and max options', () => {
    const result = splitContentForAds(paragraphs(20), { firstAfter: 1, everyParagraphs: 5, max: 3 })
    expect(result).toHaveLength(4)
    expect(result[0]).toBe(paragraphs(1))
  })

  it('keeps the wrapper balanced on every fragment', () => {
    const content = `<div class="payload-richtext">${paragraphs(10)}</div>`
    const result = splitContentForAds(content)

    expect(result).toHaveLength(2)
    for (const fragment of result) {
      expect(countTag(fragment, '<div')).toBe(1)
      expect(countTag(fragment, '</div>')).toBe(1)
      expect(fragment.startsWith('<div class="payload-richtext">')).toBe(true)
      expect(fragment.endsWith('</div>')).toBe(true)
    }
  })

  it('does not mutate or reorder paragraphs across a wrapped, multi-split post', () => {
    const openTag = '<div class="payload-richtext">'
    const closeTag = '</div>'
    const content = `${openTag}${paragraphs(15)}${closeTag}`
    const result = splitContentForAds(content)
    const rejoined = result
      .map((fragment) => fragment.slice(openTag.length, fragment.length - closeTag.length))
      .join('')
    expect(rejoined).toBe(paragraphs(15))
  })
})
