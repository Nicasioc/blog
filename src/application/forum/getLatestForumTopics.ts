import type { ForumTopic } from '@/domain/forum/forumTopic.model'
import { fetchLatestTopicsDto } from '@/persistence/discourse/discourseClient'
import { mapLatestForumTopics } from '@/persistence/discourse/mappers/forumTopicMapper'
import { isNonEmptyString } from '@/utils/checks'
import { logger } from '@/utils/logger'

const DEFAULT_LIMIT = 5

// The forum is a nice-to-have: any failure degrades to "no block" rather than
// breaking the page that renders it.
export const getLatestForumTopics = async (
  forumUrl: string | undefined,
  limit: number = DEFAULT_LIMIT,
): Promise<ForumTopic[]> => {
  if (!isNonEmptyString(forumUrl)) return []
  const baseUrl = forumUrl.replace(/\/+$/, '')
  try {
    const dto = await fetchLatestTopicsDto(baseUrl)
    return mapLatestForumTopics(dto, baseUrl, limit)
  } catch (error) {
    logger.warn('Could not load latest forum topics', {
      error: error instanceof Error ? error.message : String(error),
    })
    return []
  }
}
