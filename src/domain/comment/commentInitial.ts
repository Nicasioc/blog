const FALLBACK_INITIAL = '?'

const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' })

// Takes the first grapheme (not UTF-16 unit or code point) so emoji flags, ZWJ sequences and
// letters with combining accents stay whole.
export const getAuthorInitial = (authorName: string): string => {
  const first = graphemes.segment(authorName.trim())[Symbol.iterator]().next()
  return first.done ? FALLBACK_INITIAL : first.value.segment.toLocaleUpperCase()
}
