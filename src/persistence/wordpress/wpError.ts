export class WpApiError extends Error {
  readonly status: number
  readonly endpoint: string

  constructor(status: number, endpoint: string, message: string) {
    super(message)
    this.name = 'WpApiError'
    this.status = status
    this.endpoint = endpoint
  }
}

export const isNotFoundError = (error: unknown): boolean =>
  error instanceof WpApiError && error.status === 404
