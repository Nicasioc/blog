const SHORT_FORMAT: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
}

const LONG_FORMAT: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}

const isValidDate = (value: unknown): value is Date =>
  value instanceof Date && !Number.isNaN(value.getTime())

const format = (value: Date, options: Intl.DateTimeFormatOptions): string =>
  isValidDate(value) ? value.toLocaleDateString('en-US', options) : ''

export const formatPostDate = (value: Date): string => format(value, SHORT_FORMAT)

export const formatPostDateLong = (value: Date): string => format(value, LONG_FORMAT)
