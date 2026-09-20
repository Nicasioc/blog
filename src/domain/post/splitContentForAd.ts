export type ContentSplit = { before: string; after: string }

const PARAGRAPH_CLOSE = '</p>'

/*
 * Rich text from the CMS arrives wrapped in a single container element, e.g.
 * `<div class="payload-richtext">…</div>`. Splitting the raw string on `</p>`
 * to inject an in-content ad leaves that container unclosed in the first half,
 * which the browser silently repairs while parsing — producing a DOM that no
 * longer matches what React expects and triggering a hydration mismatch.
 *
 * So we unwrap the container, split the inner paragraphs, then re-wrap each
 * half so both fragments are independently well-formed.
 */
const WRAPPER_PATTERN = /^\s*(<(div|section|article)\b[^>]*>)([\s\S]*)<\/\2>\s*$/

type Wrapper = { openTag: string; closeTag: string; inner: string }

const unwrap = (html: string): Wrapper | null => {
  const match = WRAPPER_PATTERN.exec(html)
  if (!match) return null

  const [, openTag, tagName, inner] = match
  const openCount = (html.match(new RegExp(`<${tagName}\\b`, 'gi')) ?? []).length
  const closeCount = (html.match(new RegExp(`</${tagName}>`, 'gi')) ?? []).length

  // Unbalanced or sibling containers mean the outer tag is not a single wrapper.
  if (openCount !== closeCount) return null

  return { openTag, closeTag: `</${tagName}>`, inner }
}

const splitParagraphs = (html: string, maxParagraphs: number): ContentSplit | null => {
  const parts = html.split(PARAGRAPH_CLOSE)
  // The trailing element after the final `</p>` is not a paragraph of its own.
  const paragraphCount = parts.length - 1
  const splitAt = Math.min(maxParagraphs, Math.floor(paragraphCount / 2))
  if (splitAt < 1) return null

  return {
    before: parts.slice(0, splitAt).join(PARAGRAPH_CLOSE) + PARAGRAPH_CLOSE,
    after: parts.slice(splitAt).join(PARAGRAPH_CLOSE),
  }
}

/*
 * Splits post content into two well-formed halves so an ad can sit between them.
 * Returns null when the content is too short to split, in which case the caller
 * should render it as a single block.
 */
export const splitContentForAd = (content: string, maxParagraphs = 3): ContentSplit | null => {
  if (typeof content !== 'string' || content.trim() === '') return null

  const wrapper = unwrap(content)
  if (!wrapper) return splitParagraphs(content, maxParagraphs)

  const split = splitParagraphs(wrapper.inner, maxParagraphs)
  if (!split) return null

  return {
    before: `${wrapper.openTag}${split.before}${wrapper.closeTag}`,
    after: `${wrapper.openTag}${split.after}${wrapper.closeTag}`,
  }
}

export type SplitAdsOptions = {
  firstAfter?: number
  everyParagraphs?: number
  max?: number
}

// A post never splits into its trailing paragraphs — a split point this
// close to the end would put an ad right before the article's conclusion.
const TRAILING_GUARD = 2

const computeSplitPoints = (
  paragraphCount: number,
  { firstAfter, everyParagraphs, max }: Required<SplitAdsOptions>,
): number[] => {
  const points: number[] = []
  let next = firstAfter
  while (points.length < max && next <= paragraphCount - TRAILING_GUARD) {
    points.push(next)
    next += everyParagraphs
  }
  return points
}

// Splits `html` (paragraphs only, no wrapper) into `points.length + 1`
// well-formed fragments at the given 0-based paragraph boundaries.
const splitAtPoints = (html: string, points: number[]): string[] => {
  const parts = html.split(PARAGRAPH_CLOSE)
  const boundaries = [0, ...points]

  return boundaries.map((start, i) => {
    const end = boundaries[i + 1]
    return end === undefined
      ? parts.slice(start).join(PARAGRAPH_CLOSE)
      : parts.slice(start, end).join(PARAGRAPH_CLOSE) + PARAGRAPH_CLOSE
  })
}

/*
 * Splits post content into fragments for interleaving multiple in-content
 * ads on long posts — a fixed single split (splitContentForAd) gives a
 * 30-paragraph article the same inventory as a 6-paragraph one. Returns a
 * single-element array (the content unchanged) when there aren't enough
 * paragraphs to split into, so the caller can always render
 * `fragments.map(...)` uniformly with no null-branch.
 */
export const splitContentForAds = (
  content: string,
  { firstAfter = 3, everyParagraphs = 8, max = 2 }: SplitAdsOptions = {},
): string[] => {
  if (typeof content !== 'string' || content.trim() === '') return [content ?? '']

  const wrapper = unwrap(content)
  const inner = wrapper ? wrapper.inner : content
  const paragraphCount = inner.split(PARAGRAPH_CLOSE).length - 1
  const points = computeSplitPoints(paragraphCount, { firstAfter, everyParagraphs, max })

  if (points.length === 0) return [content]

  const fragments = splitAtPoints(inner, points)
  if (!wrapper) return fragments

  return fragments.map((fragment) => `${wrapper.openTag}${fragment}${wrapper.closeTag}`)
}
