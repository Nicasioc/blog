import { isNonEmptyString } from '@/utils/checks'

const BEARER_PREFIX = 'Bearer '

const parseBearerToken = (authorization: string | null): string | null => {
  if (!isNonEmptyString(authorization) || !authorization.startsWith(BEARER_PREFIX)) return null
  const token = authorization.slice(BEARER_PREFIX.length).trim()
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
