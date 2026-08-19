'use client'
import Link from 'next/link'
import { useConsent } from './ConsentContext'
import { Button } from '@/components/ui/button'

export const CookieConsentBanner = () => {
  const { status, isPreferencesOpen, accept, reject, closePreferences } = useConsent()

  const isReviewing = status !== null && isPreferencesOpen
  if (status !== null && !isPreferencesOpen) return null

  return (
    <div
      role="region"
      aria-label="Preferencias de cookies"
      className="bg-background text-foreground border-border fixed inset-x-0 bottom-0 z-50 border-t px-4 py-4 shadow-lg"
    >
      <div className="container mx-auto flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-sm">
          Usamos cookies propias y de terceros, incluida publicidad, para mejorar tu experiencia en
          el sitio. Los anuncios solo se cargan si aceptás. Podés cambiar tu decisión cuando quieras
          desde &quot;Preferencias de cookies&quot; en el pie de página. Más información en nuestra{' '}
          <Link href="/privacy" className="text-brand-secondary underline underline-offset-2">
            Política de Privacidad
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          {isReviewing && (
            <Button variant="ghost" onClick={closePreferences}>
              Cerrar
            </Button>
          )}
          <Button variant="outline" onClick={reject}>
            Rechazar
          </Button>
          <Button onClick={accept}>Aceptar</Button>
        </div>
      </div>
    </div>
  )
}
