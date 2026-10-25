import { isNonEmptyString } from '@/utils/checks'

const BEARER_PATTERN = /^Bearer\s+(.+)$/i

/** Reads the token from an `Authorization: Bearer <token>` header value. */
export const parseBearerToken = (authorization: string | null): string | null => {
  if (!isNonEmptyString(authorization)) return null
  const token = BEARER_PATTERN.exec(authorization.trim())?.[1]?.trim()
  return isNonEmptyString(token) ? token : null
}
