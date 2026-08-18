import type { Metadata } from 'next'
import Link from 'next/link'
import { siteConfig } from '@/lib/siteConfig'
import { ABOUT_PAGE } from '@/lib/staticPages'
import { generateStaticPageMetadata } from '@/domain/seo/metadata.utils'
import { StaticPageShell } from '@/components/layout/StaticPageShell'

const DESCRIPTION = `Qué es ${siteConfig.siteName}, cómo trabajamos y cómo se financia el proyecto.`

export const metadata: Metadata = generateStaticPageMetadata(ABOUT_PAGE, DESCRIPTION, siteConfig)

export default function AboutPage() {
  return (
    <StaticPageShell title={ABOUT_PAGE.title} description={DESCRIPTION}>
      <h2>Qué es {siteConfig.siteName}</h2>
      <p>
        {siteConfig.siteName} es un medio digital independiente dedicado a la actualidad, el
        análisis y las historias que rodean al deporte. Publicamos noticias, crónicas y artículos de
        fondo pensados para quienes siguen el día a día de cerca y quieren algo más que el titular.
      </p>

      <h2>Cómo trabajamos</h2>
      <ul>
        <li>
          <strong>Contrastamos antes de publicar.</strong> Citamos las fuentes cuando la información
          proviene de terceros y distinguimos con claridad lo que es dato de lo que es opinión.
        </li>
        <li>
          <strong>Corregimos a la vista.</strong> Cuando cometemos un error, lo rectificamos y lo
          hacemos constar en el artículo.
        </li>
        <li>
          <strong>Escuchamos a quien nos lee.</strong> Los comentarios están abiertos y moderados, y
          respondemos a los mensajes que nos llegan.
        </li>
      </ul>

      <h2>Cómo se financia el proyecto</h2>
      <p>
        {siteConfig.siteName} es un sitio de acceso libre y gratuito. Se sostiene con la publicidad
        que aparece en sus páginas, servida por proveedores externos como Google. Esa publicidad es
        independiente de nuestra línea editorial: ningún anunciante decide qué publicamos ni cómo lo
        contamos. Puedes consultar cómo funcionan las cookies y los anuncios en la{' '}
        <Link href="/privacy">Política de Privacidad</Link>.
      </p>

      <h2>Hablemos</h2>
      <p>
        ¿Una corrección, una sugerencia o una propuesta? Escríbenos a{' '}
        <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a> o pásate por la
        página de <Link href="/contact">Contacto</Link>.
      </p>
    </StaticPageShell>
  )
}
