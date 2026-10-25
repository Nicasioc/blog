import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/react'

vi.mock('@/application/blog/submitComment', () => ({ submitComment: vi.fn() }))

import { submitComment } from '@/application/blog/submitComment'
import { CommentForm } from './CommentForm'

const fillAndSubmit = async (container: HTMLElement) => {
  fireEvent.change(container.querySelector('#authorName')!, { target: { value: 'Ana' } })
  fireEvent.change(container.querySelector('#authorEmail')!, {
    target: { value: 'ana@example.com' },
  })
  fireEvent.change(container.querySelector('#content')!, { target: { value: 'Hola' } })
  fireEvent.submit(container.querySelector('form')!)
}

describe('CommentForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    vi.mocked(submitComment).mockResolvedValue({ success: true })
  })

  afterEach(() => vi.useRealTimers())

  it('renders a honeypot that is hidden from assistive tech and not keyboard reachable', () => {
    const { container } = render(<CommentForm postId={7} />)
    const honeypot = container.querySelector('input[name="website"]') as HTMLInputElement

    expect(honeypot).toBeInTheDocument()
    expect(honeypot).toHaveAttribute('tabindex', '-1')
    expect(honeypot).toHaveAttribute('autocomplete', 'off')
    expect(honeypot.closest('[aria-hidden="true"]')).not.toBeNull()
  })

  it('submits renderedAt as the mount time and an empty honeypot', async () => {
    const mountedAt = Date.now()
    const { container } = render(<CommentForm postId={7} />)
    vi.setSystemTime(mountedAt + 10_000)

    await fillAndSubmit(container)

    await waitFor(() => expect(submitComment).toHaveBeenCalledTimes(1))
    expect(vi.mocked(submitComment).mock.calls[0][0]).toEqual({
      postId: 7,
      renderedAt: mountedAt,
      website: '',
      authorName: 'Ana',
      authorEmail: 'ana@example.com',
      content: 'Hola',
    })
  })

  it('forwards a filled honeypot value to the action', async () => {
    const { container } = render(<CommentForm postId={7} />)
    fireEvent.change(container.querySelector('input[name="website"]')!, {
      target: { value: 'http://spam.test' },
    })

    await fillAndSubmit(container)

    await waitFor(() => expect(submitComment).toHaveBeenCalledTimes(1))
    expect(vi.mocked(submitComment).mock.calls[0][0]).toMatchObject({ website: 'http://spam.test' })
  })
})
