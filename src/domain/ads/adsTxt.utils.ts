const GOOGLE_CERTIFICATION_AUTHORITY_ID = 'f08c47fec0942fa0'

const buildGoogleLine = (adSensePublisherId: string): string => {
  const pubId = adSensePublisherId.replace(/^ca-/, '')
  return `google.com, ${pubId}, DIRECT, ${GOOGLE_CERTIFICATION_AUTHORITY_ID}`
}

// Entries in ADS_TXT_EXTRA_LINES may be separated by newlines (multi-line env
// value) or `|` (single-line value) — `|` never appears in a valid ads.txt line.
export const parseAdsTxtExtraLines = (raw: string | undefined): string[] =>
  (raw ?? '').split(/\r?\n|\|/)

const isAdsTxtEntry = (line: string): boolean => line !== '' && !line.startsWith('#')

// Case-insensitive, whitespace-collapsed, comma-spacing-agnostic, so
// `google.com,pub-1,DIRECT` and `Google.com, pub-1, DIRECT` dedupe together.
const toDedupeKey = (line: string): string =>
  line
    .toLowerCase()
    .replace(/\s*,\s*/g, ',')
    .replace(/\s+/g, ' ')

const dedupe = (lines: string[]): string[] =>
  lines.reduce<{ seen: Set<string>; result: string[] }>(
    (acc, line) => {
      const key = toDedupeKey(line)
      if (acc.seen.has(key)) return acc
      return { seen: new Set(acc.seen).add(key), result: [...acc.result, line] }
    },
    { seen: new Set(), result: [] },
  ).result

export const buildAdsTxtContent = (
  adSensePublisherId: string | undefined,
  extraLines: readonly string[] = [],
): string | null => {
  const googleLines = adSensePublisherId ? [buildGoogleLine(adSensePublisherId)] : []
  const extras = extraLines.map((line) => line.trim()).filter(isAdsTxtEntry)
  const lines = dedupe([...googleLines, ...extras])

  if (lines.length === 0) return null

  return `${lines.join('\n')}\n`
}
