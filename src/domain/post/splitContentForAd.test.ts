import { describe, expect, it } from 'vitest'
import { splitContentForAd } from './splitContentForAd'

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
