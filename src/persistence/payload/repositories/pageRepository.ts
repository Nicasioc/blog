import { payloadFetch } from '@/persistence/payload/payloadClient'
import { mapPayloadPageToPage } from '@/persistence/payload/mappers/pageMapper'
import type { PayloadPageDto } from '@/persistence/payload/types/payloadPage.dto'
import type { Page } from '@/domain/page/page.model'
import { serverEnv } from '@/lib/env.server'

export const fetchPageBySlug = async (slug: string): Promise<Page | null> => {
  const result = await payloadFetch<PayloadPageDto>('/pages', {
    where: { slug: { equals: slug }, _status: { equals: 'published' } },
    limit: 1,
    tags: ['pages', `page-${slug}`],
    revalidate: serverEnv.REVALIDATE_PAGES,
  })
  const dto = result.data[0]
  return dto ? mapPayloadPageToPage(dto) : null
}

export const fetchAllPageSlugs = async (): Promise<Array<{ slug: string }>> => {
  const result = await payloadFetch<PayloadPageDto>('/pages', {
    where: { _status: { equals: 'published' } },
    limit: 100,
    select: ['slug'],
    tags: ['pages'],
    revalidate: serverEnv.REVALIDATE_PAGES,
  })
  return result.data.map(({ slug }) => ({ slug }))
}
