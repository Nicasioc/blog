type BreadcrumbItem = { name: string; url: string }
type Props = { items: BreadcrumbItem[] }

const safeUrl = (url: string): string => {
  try {
    const { protocol } = new URL(url)
    return protocol === 'http:' || protocol === 'https:' ? url : ''
  } catch {
    return url.startsWith('/') ? url : ''
  }
}

export const BreadcrumbJsonLd = ({ items }: Props) => {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: safeUrl(item.url),
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
