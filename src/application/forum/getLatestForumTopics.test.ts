import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getLatestForumTopics } from './getLatestForumTopics'

vi.mock('@/persistence/discourse/discourseClient', () => ({
  fetchLatestTopicsDto: vi.fn(),
}))

import { fetchLatestTopicsDto } from '@/persistence/discourse/discourseClient'

const dto = {
  topic_list: {
    topics: [{ id: 7, title: 'Partido', slug: 'partido', archetype: 'regular', reply_count: 3 }],
  },
}

describe('getLatestForumTopics', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns [] without fetching when the forum URL is unset or empty', async () => {
    expect(await getLatestForumTopics(undefined)).toEqual([])
    expect(await getLatestForumTopics('')).toEqual([])
    expect(fetchLatestTopicsDto).not.toHaveBeenCalled()
  })

  it('maps topics and strips trailing slashes from the forum URL', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(fetchLatestTopicsDto).mockResolvedValue(dto as any)

    const result = await getLatestForumTopics('https://forum.example.com//')

    expect(fetchLatestTopicsDto).toHaveBeenCalledWith('https://forum.example.com')
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ url: 'https://forum.example.com/t/partido/7', replyCount: 3 })
  })

  it('returns [] when the fetch fails', async () => {
    vi.mocked(fetchLatestTopicsDto).mockRejectedValue(new Error('responded with 500'))
    expect(await getLatestForumTopics('https://forum.example.com')).toEqual([])
  })

  it('returns [] when the payload is malformed', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(fetchLatestTopicsDto).mockResolvedValue(null as any)
    expect(await getLatestForumTopics('https://forum.example.com')).toEqual([])
  })
})
