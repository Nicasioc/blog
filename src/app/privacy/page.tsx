import type { Metadata } from 'next'
import Link from 'next/link'
import { siteConfig } from '@/lib/siteConfig'
import { PRIVACY_PAGE } from '@/lib/staticPages'
import { generateStaticPageMetadata } from '@/domain/seo/metadata.utils'
import { StaticPageShell } from '@/components/layout/StaticPageShell'

const DESCRIPTION = `Cómo ${siteConfig.siteName} recoge y trata tus datos, qué cookies utiliza y cómo funciona la publicidad de terceros.`

export const metadata: Metadata = generateStaticPageMetadata(PRIVACY_PAGE, DESCRIPTION, siteConfig)

export default function PrivacyPage() {
  return (
    <StaticPageShell title={PRIVACY_PAGE.title} description={DESCRIPTION}>
      <h2>Responsable del tratamiento</h2>
      <p>
        El responsable del tratamiento de los datos recogidos a través de este sitio es{' '}
        {siteConfig.siteName}, accesible en <a href={siteConfig.siteUrl}>{siteConfig.siteUrl}</a>.
        Puedes contactarnos en cualquier momento escribiendo a{' '}
        <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>.
      </p>

      <h2>Qué datos recogemos</h2>
      <p>
        Navegar por {siteConfig.siteName} no requiere registro ni facilitar datos personales. Solo
        recogemos información en dos supuestos:
      </p>
      <ul>
        <li>
          <strong>Comentarios.</strong> Si dejas un comentario en un artículo, guardamos el nombre y
          la dirección de correo que indicas, junto al texto del comentario. El correo no se publica
          nunca: lo usamos únicamente para moderar y, si hiciera falta, responderte.
        </li>
        <li>
          <strong>Datos técnicos de navegación.</strong> Como cualquier sitio web, nuestros
          servidores y los de nuestros proveedores registran datos como la dirección IP, el tipo de
          navegador, el dispositivo y las páginas visitadas.
        </li>
      </ul>
      <p>
        No vendemos ni cedemos tus datos personales a terceros más allá de los proveedores descritos
        en esta política.
      </p>

      <h2>Uso de cookies</h2>
      <p>
        Una cookie es un pequeño archivo que un sitio web guarda en tu navegador. En{' '}
        {siteConfig.siteName} se utilizan dos tipos:
      </p>
      <ul>
        <li>
          <strong>Cookies propias</strong>, necesarias para el funcionamiento básico del sitio y
          para recordar preferencias de navegación.
        </li>
        <li>
          <strong>Cookies de terceros</strong>, instaladas por los proveedores de publicidad y de
          analítica que utilizamos, y que se describen en el apartado siguiente.
        </li>
      </ul>

      <h2>Publicidad de terceros</h2>
      <p>
        Este sitio se financia mediante publicidad. Los anuncios los sirven proveedores externos,
        entre ellos <strong>Google</strong>, que actúan como proveedores de publicidad
        independientes.
      </p>
      <ul>
        <li>
          Google utiliza cookies —incluida la cookie DART de DoubleClick— para mostrar anuncios
          basados en tus visitas a este y a otros sitios de internet.
        </li>
        <li>
          Otras empresas de publicidad y redes de terceros pueden asimismo utilizar cookies, balizas
          web o tecnologías similares para medir la eficacia de sus anuncios y personalizar el
          contenido que ves.
        </li>
        <li>
          {siteConfig.siteName} no controla ni tiene acceso a las cookies que instalan estos
          terceros, ni a la información que recogen a través de ellas.
        </li>
      </ul>
      <p>
        Puedes desactivar la personalización de anuncios de Google desde la{' '}
        <a
          href="https://www.google.com/settings/ads"
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          configuración de anuncios de Google
        </a>{' '}
        y consultar más detalles en la página sobre{' '}
        <a
          href="https://policies.google.com/technologies/ads"
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          cómo utiliza Google las cookies en la publicidad
        </a>
        . Para inhabilitar el uso de cookies por parte de otros proveedores externos puedes visitar{' '}
        <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer nofollow">
          aboutads.info
        </a>
        .
      </p>

      <h2>Cómo desactivar las cookies</h2>
      <p>
        Puedes bloquear o eliminar las cookies desde la configuración de tu navegador (Chrome,
        Firefox, Safari, Edge y el resto ofrecen esta opción en su apartado de privacidad). Ten en
        cuenta que desactivarlas por completo puede afectar al funcionamiento de algunas partes del
        sitio.
      </p>

      <h2>Enlaces a otros sitios</h2>
      <p>
        Nuestros artículos pueden enlazar a sitios web de terceros. Esta política de privacidad no
        se aplica a esos sitios: te recomendamos consultar la suya antes de facilitarles cualquier
        dato.
      </p>

      <h2>Tus derechos</h2>
      <p>
        Puedes solicitar en cualquier momento el acceso, la rectificación o la eliminación de los
        datos que hayamos recogido —por ejemplo, el nombre y el correo asociados a un comentario—
        escribiendo a <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>.
      </p>

      <h2>Cambios en esta política</h2>
      <p>
        Podemos actualizar esta política para reflejar cambios en el sitio o en la normativa
        aplicable. La versión publicada en esta página es siempre la vigente.
      </p>
      <p>
        Consulta también nuestros <Link href="/terms">Términos y Condiciones</Link> o escríbenos
        desde la página de <Link href="/contact">Contacto</Link>.
      </p>
    </StaticPageShell>
  )
}
