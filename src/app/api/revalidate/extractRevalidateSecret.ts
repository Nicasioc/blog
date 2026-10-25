import { isNonEmptyString } from '@/utils/checks'

const BEARER_PATTERN = /^Bearer\s+(.+)$/i

const parseBearerToken = (authorization: string | null): string | null => {
  if (!isNonEmptyString(authorization)) return null
  const token = BEARER_PATTERN.exec(authorization.trim())?.[1]?.trim()
  return isNonEmptyString(token) ? token : null
}

/**
 * Reads the revalidate secret from `Authorization: Bearer <secret>`, falling back to the
 * `?secret=` query param until the header transition ends (BLO-209 removes the fallback).
 */
export const extractRevalidateSecret = (
  authorization: string | null,
  querySecret: string | null,
): string | null => {
  const bearer = parseBearerToken(authorization)
  if (bearer) return bearer
  return isNonEmptyString(querySecret) ? querySecret : null
}
