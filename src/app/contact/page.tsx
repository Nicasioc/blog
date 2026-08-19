import type { Metadata } from 'next'
import Link from 'next/link'
import { siteConfig } from '@/lib/siteConfig'
import { CONTACT_PAGE } from '@/lib/staticPages'
import { generateStaticPageMetadata } from '@/domain/seo/metadata.utils'
import { StaticPageShell } from '@/components/layout/StaticPageShell'

const DESCRIPTION = `Escríbenos: dudas, correcciones, sugerencias de temas o propuestas de colaboración con ${siteConfig.siteName}.`

export const metadata: Metadata = generateStaticPageMetadata(CONTACT_PAGE, DESCRIPTION, siteConfig)

export default function ContactPage() {
  return (
    <StaticPageShell title={CONTACT_PAGE.title} description={DESCRIPTION}>
      <h2>Escríbenos</h2>
      <p>
        La forma más directa de contactar con {siteConfig.siteName} es el correo electrónico:{' '}
        <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>.
      </p>
      <p>
        Leemos todos los mensajes y solemos responder en un plazo de dos o tres días laborables.
      </p>

      <h2>Sobre qué puedes escribirnos</h2>
      <ul>
        <li>
          <strong>Correcciones.</strong> Si detectas un error o un dato desactualizado en un
          artículo, cuéntanoslo e indícanos el enlace: lo revisamos y lo corregimos.
        </li>
        <li>
          <strong>Sugerencias de temas.</strong> Nos interesa saber qué te gustaría leer.
        </li>
        <li>
          <strong>Derechos de contenido.</strong> Si eres titular de una imagen o un texto y
          consideras que su uso no es correcto, escríbenos y lo resolvemos.
        </li>
        <li>
          <strong>Publicidad y colaboraciones.</strong> Para propuestas comerciales, utiliza la
          misma dirección indicando el motivo en el asunto.
        </li>
        <li>
          <strong>Privacidad.</strong> Para ejercer tus derechos sobre los datos que hayamos
          recogido, consulta la <Link href="/privacy">Política de Privacidad</Link>.
        </li>
      </ul>

      <h2>Quiénes somos</h2>
      <p>
        Si quieres conocer el proyecto antes de escribirnos, puedes leer más en{' '}
        <Link href="/about">Sobre Nosotros</Link>.
      </p>
    </StaticPageShell>
  )
}
