import type { Metadata } from 'next'
import Link from 'next/link'
import { siteConfig } from '@/lib/siteConfig'
import { TERMS_PAGE } from '@/lib/staticPages'
import { generateStaticPageMetadata } from '@/domain/seo/metadata.utils'
import { StaticPageShell } from '@/components/layout/StaticPageShell'

const DESCRIPTION = `Condiciones de uso de ${siteConfig.siteName}: propiedad intelectual, normas de participación y limitación de responsabilidad.`

export const metadata: Metadata = generateStaticPageMetadata(TERMS_PAGE, DESCRIPTION, siteConfig)

export default function TermsPage() {
  return (
    <StaticPageShell title={TERMS_PAGE.title} description={DESCRIPTION}>
      <h2>Aceptación de las condiciones</h2>
      <p>
        Al acceder y navegar por {siteConfig.siteName} aceptas estas condiciones de uso. Si no estás
        de acuerdo con alguna de ellas, te pedimos que no utilices el sitio.
      </p>

      <h2>Uso del sitio</h2>
      <p>
        El contenido de {siteConfig.siteName} se ofrece con fines informativos y de entretenimiento.
        Puedes consultarlo y compartirlo libremente, pero no está permitido:
      </p>
      <ul>
        <li>Utilizar el sitio con fines ilícitos o que perjudiquen a terceros.</li>
        <li>
          Intentar acceder a áreas restringidas, alterar su funcionamiento o introducir código
          malicioso.
        </li>
        <li>
          Extraer el contenido de forma automatizada y masiva para republicarlo en otro medio.
        </li>
      </ul>

      <h2>Propiedad intelectual</h2>
      <p>
        Los textos, el diseño y los elementos gráficos originales de {siteConfig.siteName}{' '}
        pertenecen a sus autores. Puedes citar fragmentos siempre que indiques la fuente y enlaces
        al artículo original. La reproducción íntegra de un artículo requiere autorización previa.
      </p>
      <p>
        Las imágenes, marcas y escudos que aparecen en el sitio pertenecen a sus respectivos
        titulares y se utilizan con fines informativos. Si eres titular de un contenido y consideras
        que su uso no es correcto, escríbenos a{' '}
        <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a> y lo retiraremos
        o corregiremos.
      </p>

      <h2>Comentarios y participación</h2>
      <p>
        Los comentarios se moderan antes de publicarse. Nos reservamos el derecho a no publicar o a
        eliminar aquellos que:
      </p>
      <ul>
        <li>Contengan insultos, amenazas o incitación al odio.</li>
        <li>Sean publicidad, spam o enlaces ajenos al tema del artículo.</li>
        <li>Vulneren derechos de terceros o difundan datos personales.</li>
      </ul>
      <p>
        Cada persona es responsable de las opiniones que publica. Los comentarios no reflejan la
        posición editorial de {siteConfig.siteName}.
      </p>

      <h2>Publicidad y enlaces a terceros</h2>
      <p>
        El sitio muestra publicidad servida por proveedores externos y puede enlazar a webs de
        terceros. No controlamos ni respondemos del contenido, los productos o las prácticas de esos
        sitios. Puedes consultar cómo funciona la publicidad en nuestra{' '}
        <Link href="/privacy">Política de Privacidad</Link>.
      </p>

      <h2>Limitación de responsabilidad</h2>
      <p>
        Cuidamos la exactitud de lo que publicamos, pero el contenido se ofrece «tal cual», sin
        garantía de que esté libre de errores o permanentemente actualizado. {siteConfig.siteName}{' '}
        no se hace responsable de los daños derivados del uso de la información publicada ni de
        posibles interrupciones del servicio.
      </p>

      <h2>Modificación de las condiciones</h2>
      <p>
        Podemos actualizar estas condiciones en cualquier momento. La versión publicada en esta
        página es la que está en vigor.
      </p>

      <h2>Contacto</h2>
      <p>
        Para cualquier duda sobre estas condiciones puedes escribirnos desde la página de{' '}
        <Link href="/contact">Contacto</Link>.
      </p>
    </StaticPageShell>
  )
}
