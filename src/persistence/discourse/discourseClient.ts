import type { DiscourseLatestDto } from '@/persistence/discourse/types/discourseTopic.dto'

const FORUM_CACHE_TAG = 'forum'
const FORUM_REVALIDATE_SECONDS = 600

export const fetchLatestTopicsDto = async (forumUrl: string): Promise<DiscourseLatestDto> => {
  const response = await fetch(`${forumUrl}/latest.json`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: FORUM_REVALIDATE_SECONDS, tags: [FORUM_CACHE_TAG] },
  })
  if (!response.ok) {
    throw new Error(`Discourse latest.json responded with ${response.status}`)
  }
  return (await response.json()) as DiscourseLatestDto
}
