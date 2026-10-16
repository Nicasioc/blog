const LINE_SEPARATOR = String.fromCharCode(0x2028)
const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029)

const ESCAPES: Record<string, string> = {
  '<': '\\u003c',
  [LINE_SEPARATOR]: '\\u2028',
  [PARAGRAPH_SEPARATOR]: '\\u2029',
}

const UNSAFE_CHARS = new RegExp(`[<${LINE_SEPARATOR}${PARAGRAPH_SEPARATOR}]`, 'g')

// JSON.stringify leaves `<` and the line/paragraph separators (U+2028/2029)
// unescaped, so a value containing `</script>` would end the surrounding
// <script> tag. Escape them as unicode escapes; the output is still valid JSON
// with the same value.
export const serializeJsonLd = (value: unknown): string => {
  // JSON.stringify returns undefined for undefined, functions and symbols.
  const json = JSON.stringify(value) ?? 'null'
  return json.replace(UNSAFE_CHARS, (char) => ESCAPES[char])
}
