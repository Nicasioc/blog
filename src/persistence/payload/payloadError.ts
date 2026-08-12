export class PayloadApiError extends Error {
  readonly status: number
  readonly endpoint: string

  constructor(status: number, endpoint: string, message: string) {
    super(message)
    this.name = 'PayloadApiError'
    this.status = status
    this.endpoint = endpoint
  }
}

export const isNotFoundError = (error: unknown): boolean =>
  error instanceof PayloadApiError && error.status === 404
