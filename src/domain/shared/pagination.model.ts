export type PaginationInfo = {
  currentPage: number
  totalPages: number
  totalItems: number
  perPage: number
}

/** Posts per page on the blog list and category/tag archives. */
export const ARCHIVE_PAGE_SIZE = 10

/** Total pages for `totalItems` at the archive page size (at least 1). */
export const archivePageCount = (totalItems: number): number =>
  Math.max(
    1,
    Math.ceil((Number.isFinite(totalItems) && totalItems > 0 ? totalItems : 0) / ARCHIVE_PAGE_SIZE),
  )
