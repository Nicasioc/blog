import { describe, it, expect } from 'vitest'
import { toSlugWithDate } from '@/persistence/payload/mappers/slugWithDateMapper'

describe('toSlugWithDate', () => {
  it('maps slug and parses updatedAt', () => {
    const result = toSlugWithDate({ slug: 'hello-world', updatedAt: '2026-04-05T06:07:08.000Z' })
    expect(result).toEqual({
      slug: 'hello-world',
      updatedAt: new Date('2026-04-05T06:07:08.000Z'),
    })
  })

  it.each([undefined, null, '', 'not-a-date'])(
    'falls back to the epoch when updatedAt is %o',
    (updatedAt) => {
      const result = toSlugWithDate({
        slug: 'x',
        updatedAt: updatedAt as string | null | undefined,
      })
      expect(result.updatedAt.getTime()).toBe(0)
    },
  )
})
