'use client'
import { useConsent } from './ConsentContext'

export const CookiePreferencesButton = () => {
  const { openPreferences } = useConsent()

  return (
    <button
      type="button"
      onClick={openPreferences}
      className="text-primary-foreground/80 hover:text-brand-secondary hover:bg-primary-foreground/10 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150"
    >
      Preferencias de cookies
    </button>
  )
}
