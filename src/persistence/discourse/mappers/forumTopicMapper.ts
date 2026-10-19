import type { ForumTopic } from '@/domain/forum/forumTopic.model'
import type {
  DiscourseLatestDto,
  DiscourseTopicDto,
} from '@/persistence/discourse/types/discourseTopic.dto'
import { parseDate } from '@/utils/date'
import { isNonEmptyString } from '@/utils/checks'

const isListable = (topic: DiscourseTopicDto): boolean =>
  topic.archetype === 'regular' && topic.visible !== false && topic.pinned !== true

export const mapForumTopic = (topic: DiscourseTopicDto, forumUrl: string): ForumTopic | null => {
  if (typeof topic.id !== 'number' || !isNonEmptyString(topic.title)) return null
  const slug = isNonEmptyString(topic.slug) ? topic.slug : 'topic'
  return {
    id: topic.id,
    title: topic.title,
    url: `${forumUrl}/t/${slug}/${topic.id}`,
    replyCount: typeof topic.reply_count === 'number' ? topic.reply_count : 0,
    lastActivityAt: parseDate(topic.last_posted_at)?.toISOString() ?? null,
  }
}

export const mapLatestForumTopics = (
  dto: DiscourseLatestDto | null | undefined,
  forumUrl: string,
  limit: number,
): ForumTopic[] => {
  const topics = dto?.topic_list?.topics
  if (!Array.isArray(topics)) return []
  return topics
    .filter((topic) => typeof topic === 'object' && topic !== null && isListable(topic))
    .map((topic) => mapForumTopic(topic, forumUrl))
    .filter((topic): topic is ForumTopic => topic !== null)
    .slice(0, limit)
}
