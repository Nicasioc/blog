import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchLatestTopicsDto } from './discourseClient'

describe('fetchLatestTopicsDto', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('requests latest.json with ISR caching and returns the parsed body', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ topic_list: { topics: [] } }) })

    const result = await fetchLatestTopicsDto('https://forum.example.com')

    expect(result).toEqual({ topic_list: { topics: [] } })
    expect(fetchMock).toHaveBeenCalledWith(
      'https://forum.example.com/latest.json',
      expect.objectContaining({ next: { revalidate: 600, tags: ['forum'] } }),
    )
  })

  it('throws on a non-OK response', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503 })
    await expect(fetchLatestTopicsDto('https://forum.example.com')).rejects.toThrow('503')
  })
})
