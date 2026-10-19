import { describe, it, expect } from 'vitest'
import { mapForumTopic, mapLatestForumTopics } from './forumTopicMapper'

const FORUM = 'https://forum.example.com'

const topic = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 1,
    title: 'Hola',
    slug: 'hola',
    reply_count: 2,
    last_posted_at: '2026-10-15T10:00:00.000Z',
    archetype: 'regular',
    visible: true,
    pinned: false,
    ...overrides,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any

describe('mapForumTopic', () => {
  it('maps a complete topic', () => {
    expect(mapForumTopic(topic(), FORUM)).toEqual({
      id: 1,
      title: 'Hola',
      url: 'https://forum.example.com/t/hola/1',
      replyCount: 2,
      lastActivityAt: '2026-10-15T10:00:00.000Z',
    })
  })

  it('returns null when id or title is missing or blank', () => {
    expect(mapForumTopic(topic({ id: undefined }), FORUM)).toBeNull()
    expect(mapForumTopic(topic({ title: '  ' }), FORUM)).toBeNull()
    expect(mapForumTopic(topic({ title: null }), FORUM)).toBeNull()
  })

  it('falls back for missing slug, reply count and invalid date', () => {
    const result = mapForumTopic(
      topic({ slug: undefined, reply_count: 'x', last_posted_at: 'nope' }),
      FORUM,
    )
    expect(result).toMatchObject({
      url: 'https://forum.example.com/t/topic/1',
      replyCount: 0,
      lastActivityAt: null,
    })
  })
})

describe('mapLatestForumTopics', () => {
  it('returns [] for null, undefined or malformed payloads', () => {
    expect(mapLatestForumTopics(null, FORUM, 5)).toEqual([])
    expect(mapLatestForumTopics(undefined, FORUM, 5)).toEqual([])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(mapLatestForumTopics({} as any, FORUM, 5)).toEqual([])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(mapLatestForumTopics({ topic_list: { topics: 'x' } } as any, FORUM, 5)).toEqual([])
  })

  it('skips pinned, hidden, non-regular and malformed entries', () => {
    const dto = {
      topic_list: {
        topics: [
          topic({ id: 1, pinned: true }),
          topic({ id: 2, visible: false }),
          topic({ id: 3, archetype: 'private_message' }),
          null,
          topic({ id: 4, title: undefined }),
          topic({ id: 5 }),
        ],
      },
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(mapLatestForumTopics(dto as any, FORUM, 5).map((t) => t.id)).toEqual([5])
  })

  it('respects the limit', () => {
    const dto = { topic_list: { topics: [1, 2, 3].map((id) => topic({ id })) } }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(mapLatestForumTopics(dto as any, FORUM, 2)).toHaveLength(2)
  })
})
