import {
  Pagination as PaginationRoot,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import type { PaginationInfo } from '@/domain/shared/pagination.model'

type Props = { pagination: PaginationInfo; basePath: string }

const buildPageUrl = (basePath: string, page: number) =>
  page === 1 ? basePath : `${basePath}?page=${page}`

export const Pagination = ({ pagination, basePath }: Props) => {
  const { currentPage, totalPages } = pagination
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <PaginationRoot className="mt-8">
      <PaginationContent>
        {currentPage > 1 && (
          <PaginationItem>
            <PaginationPrevious href={buildPageUrl(basePath, currentPage - 1)} />
          </PaginationItem>
        )}
        {pages.map((page) => (
          <PaginationItem key={page}>
            <PaginationLink href={buildPageUrl(basePath, page)} isActive={page === currentPage}>
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}
        {currentPage < totalPages && (
          <PaginationItem>
            <PaginationNext href={buildPageUrl(basePath, currentPage + 1)} />
          </PaginationItem>
        )}
      </PaginationContent>
    </PaginationRoot>
  )
}
