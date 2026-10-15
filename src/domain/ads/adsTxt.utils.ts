import { isNonEmptyString } from '@/utils/checks'

const GOOGLE_CERTIFICATION_AUTHORITY_ID = 'f08c47fec0942fa0'

// Field 1 of an ads.txt record (zero-based) is the seller account id, which
// an exchange may treat as case-sensitive; every other field is not.
const ACCOUNT_ID_FIELD = 1

const buildGoogleLine = (adSensePublisherId: string): string => {
  const pubId = adSensePublisherId.replace(/^ca-/, '')
  return `google.com, ${pubId}, DIRECT, ${GOOGLE_CERTIFICATION_AUTHORITY_ID}`
}

// Entries in ADS_TXT_EXTRA_LINES may be separated by newlines (multi-line env
// value) or `|` (single-line value) — `|` never appears in a valid ads.txt
// line. Entries come back trimmed, with blank ones dropped.
export const parseAdsTxtExtraLines = (raw: string | undefined): string[] =>
  isNonEmptyString(raw)
    ? raw
        .split(/\r?\n|\|/)
        .map((line) => line.trim())
        .filter(isNonEmptyString)
    : []

const isAdsTxtEntry = (line: string): boolean => isNonEmptyString(line) && !line.startsWith('#')

const stripInlineComment = (line: string): string => line.split('#')[0]

// Ignores whitespace, comma spacing and a trailing `# comment`, and case in
// every field except the account id — so `google.com,pub-1,DIRECT` and
// `Google.com, pub-1, direct # GAM` dedupe, but `x.com, AbC` and `x.com, abc`
// don't.
const toDedupeKey = (line: string): string =>
  stripInlineComment(line)
    .split(',')
    .map((field) => field.trim().replace(/\s+/g, ' '))
    .map((field, index) => (index === ACCOUNT_ID_FIELD ? field : field.toLowerCase()))
    .join(',')

const dedupe = (lines: string[]): string[] => {
  const seen = new Set<string>()
  return lines.filter((line) => {
    const key = toDedupeKey(line)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export const buildAdsTxtContent = (
  adSensePublisherId: string | undefined,
  extraLines: readonly string[] = [],
): string | null => {
  const googleLines = isNonEmptyString(adSensePublisherId)
    ? [buildGoogleLine(adSensePublisherId)]
    : []
  const extras = extraLines.map((line) => line.trim()).filter(isAdsTxtEntry)
  const lines = dedupe([...googleLines, ...extras])

  if (lines.length === 0) return null

  return `${lines.join('\n')}\n`
}
