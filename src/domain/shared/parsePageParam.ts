import { isNonEmptyString } from '@/utils/checks'

const DIGITS_ONLY = /^\d+$/

// `?page=` comes straight from the URL, so it can be missing, repeated (an array) or garbage.
// Anything that isn't a plain positive integer falls back to the first page.
export const parsePageParam = (raw: unknown): number => {
  if (!isNonEmptyString(raw) || !DIGITS_ONLY.test(raw)) return 1

  const page = Number(raw)
  return Number.isSafeInteger(page) && page >= 1 ? page : 1
}
