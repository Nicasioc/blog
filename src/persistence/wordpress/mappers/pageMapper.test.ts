import { describe, it, expect } from 'vitest'
import { mapWpPageToPage } from '@/persistence/wordpress/mappers/pageMapper'
import type { WpPageDto } from '@/persistence/wordpress/types/wpPage.dto'

const baseDto: WpPageDto = {
  id: 5,
  slug: 'about',
  status: 'publish',
  modified_gmt: '2024-06-01T08:00:00',
  title: { rendered: 'About Us' },
  content: { rendered: '<p>About content</p>' },
  link: 'https://example.com/about',
}

describe('mapWpPageToPage', () => {
  it('maps scalar fields', () => {
    const page = mapWpPageToPage(baseDto)
    expect(page.id).toBe(5)
    expect(page.slug).toBe('about')
    expect(page.title).toBe('About Us')
    expect(page.content).toBe('<p>About content</p>')
  })

  it('parses modified_gmt as UTC Date', () => {
    const page = mapWpPageToPage(baseDto)
    expect(page.modifiedAt.toISOString()).toBe('2024-06-01T08:00:00.000Z')
  })

  it('returns seo: null when yoast_head_json is absent', () => {
    const page = mapWpPageToPage(baseDto)
    expect(page.seo).toBeNull()
  })

  it('returns seo: null when both title and description are empty', () => {
    const dto: WpPageDto = { ...baseDto, yoast_head_json: { title: '', description: '' } }
    const page = mapWpPageToPage(dto)
    expect(page.seo).toBeNull()
  })

  it('extracts seo fields from yoast_head_json', () => {
    const dto: WpPageDto = {
      ...baseDto,
      yoast_head_json: {
        title: 'SEO Title',
        description: 'SEO Desc',
        og_image: [{ url: 'https://example.com/og.jpg' }],
      },
    }
    const page = mapWpPageToPage(dto)
    expect(page.seo?.metaTitle).toBe('SEO Title')
    expect(page.seo?.metaDescription).toBe('SEO Desc')
    expect(page.seo?.ogImage).toBe('https://example.com/og.jpg')
  })

  it('returns ogImage: null when og_image is absent', () => {
    const dto: WpPageDto = {
      ...baseDto,
      yoast_head_json: { title: 'SEO Title', description: 'SEO Desc' },
    }
    const page = mapWpPageToPage(dto)
    expect(page.seo?.ogImage).toBeNull()
  })
})
