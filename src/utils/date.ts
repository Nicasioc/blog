/**
 * Generic date helpers with no domain knowledge.
 *
 * Data that crosses a system boundary (CMS payloads, API responses) can carry
 * missing, `null`, or non-ISO date strings. `new Date(bad)` yields an `Invalid
 * Date` that silently poisons anything downstream (e.g. an empty `<lastmod>` in
 * the sitemap), so parsing always goes through here.
 */

const isValidDate = (value: unknown): value is Date =>
  value instanceof Date && !Number.isNaN(value.getTime())

/** Parse an unknown value into a `Date`, or `null` when it is not a usable date. */
export const parseDate = (value: unknown): Date | null => {
  if (isValidDate(value)) return value
  if (typeof value !== 'string' && typeof value !== 'number') return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/** Parse an unknown value into a `Date`, falling back to `fallback` when unusable. */
export const parseDateOr = (value: unknown, fallback: Date): Date => parseDate(value) ?? fallback

/**
 * The most recent of `dates`, ignoring invalid entries. Returns `fallback` when
 * no valid date is present.
 */
export const latestDate = (dates: ReadonlyArray<Date>, fallback: Date): Date => {
  const valid = dates.filter(isValidDate)
  if (valid.length === 0) return fallback
  return valid.reduce((latest, date) => (date.getTime() > latest.getTime() ? date : latest))
}
