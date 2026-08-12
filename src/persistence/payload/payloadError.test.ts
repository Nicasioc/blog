import { describe, it, expect } from 'vitest'
import { PayloadApiError, isNotFoundError } from './payloadError'

describe('PayloadApiError', () => {
  it('sets status, endpoint, name, and message', () => {
    const error = new PayloadApiError(500, '/posts', 'Payload API error: 500')

    expect(error.status).toBe(500)
    expect(error.endpoint).toBe('/posts')
    expect(error.name).toBe('PayloadApiError')
    expect(error.message).toBe('Payload API error: 500')
    expect(error).toBeInstanceOf(Error)
  })
})

describe('isNotFoundError', () => {
  it('returns true for a PayloadApiError with status 404', () => {
    expect(isNotFoundError(new PayloadApiError(404, '/posts', 'not found'))).toBe(true)
  })

  it('returns false for a PayloadApiError with a different status', () => {
    expect(isNotFoundError(new PayloadApiError(500, '/posts', 'server error'))).toBe(false)
  })

  it('returns false for a plain Error', () => {
    expect(isNotFoundError(new Error('not found'))).toBe(false)
  })

  it('returns false for non-error values', () => {
    expect(isNotFoundError(null)).toBe(false)
    expect(isNotFoundError(undefined)).toBe(false)
    expect(isNotFoundError('404')).toBe(false)
  })
})
