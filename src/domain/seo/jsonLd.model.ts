export type PersonJsonLd = {
  '@type': 'Person'
  name: string
  url?: string
}

export type OrganizationJsonLd = {
  '@type': 'Organization'
  name: string
  logo?: {
    '@type': 'ImageObject'
    url: string
  }
}

export type ArticleJsonLd = {
  '@context': 'https://schema.org'
  '@type': 'Article' | 'BlogPosting'
  headline: string
  datePublished: string
  dateModified: string
  author: PersonJsonLd
  publisher: OrganizationJsonLd
  image?: string
  description?: string
  url: string
}

export type BreadcrumbItem = {
  '@type': 'ListItem'
  position: number
  name: string
  item: string
}

export type BreadcrumbJsonLd = {
  '@context': 'https://schema.org'
  '@type': 'BreadcrumbList'
  itemListElement: BreadcrumbItem[]
}

export type WebSiteJsonLd = {
  '@context': 'https://schema.org'
  '@type': 'WebSite'
  name: string
  url: string
  description?: string
}
