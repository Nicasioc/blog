export const isNil = (value: unknown): value is null | undefined =>
  value === null || value === undefined

export const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

export const isNonEmptyArray = <T>(value: unknown): value is T[] =>
  Array.isArray(value) && value.length > 0

export const isNonEmptyObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  Object.keys(value).length > 0
