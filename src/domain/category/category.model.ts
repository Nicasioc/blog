export type Category = {
  id: number
  slug: string
  name: string
  description: string
  postCount: number
  // Last time the category record changed. Falls back to the epoch when the CMS
  // payload carries no usable date — consumers (e.g. the sitemap) treat epoch as
  // "unknown" rather than emitting a misleading 1970 timestamp.
  updatedAt: Date
}
