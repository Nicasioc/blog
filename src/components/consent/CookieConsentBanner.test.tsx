import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CookieConsentBanner } from './CookieConsentBanner'
import { ConsentProvider } from './ConsentContext'
import { CONSENT_STORAGE_KEY } from '@/domain/consent/consent.model'

const renderBanner = () =>
  render(
    <ConsentProvider>
      <CookieConsentBanner />
    </ConsentProvider>,
  )

beforeEach(() => {
  window.localStorage.clear()
})

describe('CookieConsentBanner', () => {
  it('shows the banner and offers accept/reject with equal prominence when there is no stored decision', () => {
    renderBanner()
    expect(screen.getByRole('region', { name: 'Preferencias de cookies' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Aceptar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Rechazar' })).toBeInTheDocument()
  })

  it('persists acceptance and hides the banner', async () => {
    const user = userEvent.setup()
    renderBanner()

    await user.click(screen.getByRole('button', { name: 'Aceptar' }))

    expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toBe('accepted')
    expect(
      screen.queryByRole('region', { name: 'Preferencias de cookies' }),
    ).not.toBeInTheDocument()
  })

  it('persists rejection and hides the banner', async () => {
    const user = userEvent.setup()
    renderBanner()

    await user.click(screen.getByRole('button', { name: 'Rechazar' }))

    expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toBe('rejected')
    expect(
      screen.queryByRole('region', { name: 'Preferencias de cookies' }),
    ).not.toBeInTheDocument()
  })

  it('does not render when a valid decision is already stored', () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, 'accepted')
    renderBanner()

    expect(
      screen.queryByRole('region', { name: 'Preferencias de cookies' }),
    ).not.toBeInTheDocument()
  })

  it('ignores a corrupted stored value and asks again', () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, 'not-a-real-status')
    renderBanner()

    expect(screen.getByRole('region', { name: 'Preferencias de cookies' })).toBeInTheDocument()
  })
})
