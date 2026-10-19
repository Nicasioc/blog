export type DiscourseTopicDto = {
  id?: number
  title?: string
  slug?: string
  reply_count?: number
  last_posted_at?: string | null
  archetype?: string
  visible?: boolean
  pinned?: boolean
}

export type DiscourseLatestDto = {
  topic_list?: { topics?: DiscourseTopicDto[] }
}
