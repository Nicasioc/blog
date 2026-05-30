export type WpAuthorDto = {
  id: number
  slug: string
  name: string
  description: string
  link: string
  avatar_urls: {
    '24'?: string
    '48'?: string
    '96'?: string
  }
}
