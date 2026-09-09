export type PayloadCategoryDto = {
  id: number
  name: string
  slug: string
  description?: string | null
  // Payload maintains this on every collection; used for sitemap <lastmod>.
  updatedAt?: string | null
}
