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
