import { describe, it, expect } from 'vitest'
import { ARCHIVE_PAGE_SIZE, archivePageCount } from '@/domain/shared/pagination.model'

describe('archivePageCount', () => {
  it('returns 1 for an empty or tiny archive', () => {
    expect(archivePageCount(0)).toBe(1)
    expect(archivePageCount(ARCHIVE_PAGE_SIZE)).toBe(1)
  })

  it('rounds up partial pages', () => {
    expect(archivePageCount(ARCHIVE_PAGE_SIZE + 1)).toBe(2)
    expect(archivePageCount(ARCHIVE_PAGE_SIZE * 3)).toBe(3)
    expect(archivePageCount(ARCHIVE_PAGE_SIZE * 3 + 1)).toBe(4)
  })

  it.each([-5, NaN, Infinity])('treats unusable input %o as empty', (input) => {
    expect(archivePageCount(input)).toBe(1)
  })
})
