import { describe, it, expect } from 'vitest'
import { buildSiteManifest } from '@/domain/seo/manifest.utils'

const baseConfig = {
  siteName: 'Test FC News',
  themeColor: '#13294b',
}

describe('buildSiteManifest', () => {
  it('sets name and short_name from siteName', () => {
    const manifest = buildSiteManifest(baseConfig)
    expect(manifest.name).toBe('Test FC News')
    expect(manifest.short_name).toBe('Test FC News')
  })

  it('generates description from siteName', () => {
    const manifest = buildSiteManifest(baseConfig)
    expect(manifest.description).toBe('Test FC News — últimas noticias y novedades')
  })

  it('sets theme_color from config', () => {
    const manifest = buildSiteManifest(baseConfig)
    expect(manifest.theme_color).toBe('#13294b')
  })

  it('sets fixed display, start_url, and background_color', () => {
    const manifest = buildSiteManifest(baseConfig)
    expect(manifest.start_url).toBe('/')
    expect(manifest.display).toBe('standalone')
    expect(manifest.background_color).toBe('#ffffff')
  })

  it('returns empty icons array when no icon URLs provided', () => {
    const manifest = buildSiteManifest(baseConfig)
    expect(manifest.icons).toEqual([])
  })

  it('includes 192x192 icon when icon192Url is provided', () => {
    const manifest = buildSiteManifest({
      ...baseConfig,
      icon192Url: 'https://cdn.example.com/icon-192.png',
    })
    const icons = manifest.icons as Array<{ src: string; sizes: string; type: string }>
    expect(icons).toHaveLength(1)
    expect(icons[0]).toEqual({
      src: 'https://cdn.example.com/icon-192.png',
      sizes: '192x192',
      type: 'image/png',
    })
  })

  it('includes 512x512 icon when icon512Url is provided', () => {
    const manifest = buildSiteManifest({
      ...baseConfig,
      icon512Url: 'https://cdn.example.com/icon-512.png',
    })
    const icons = manifest.icons as Array<{ src: string; sizes: string; type: string }>
    expect(icons).toHaveLength(1)
    expect(icons[0]).toEqual({
      src: 'https://cdn.example.com/icon-512.png',
      sizes: '512x512',
      type: 'image/png',
    })
  })

  it('includes both icons when both URLs are provided', () => {
    const manifest = buildSiteManifest({
      ...baseConfig,
      icon192Url: 'https://cdn.example.com/icon-192.png',
      icon512Url: 'https://cdn.example.com/icon-512.png',
    })
    const icons = manifest.icons as Array<{ src: string; sizes: string; type: string }>
    expect(icons).toHaveLength(2)
    expect(icons[0].sizes).toBe('192x192')
    expect(icons[1].sizes).toBe('512x512')
  })
})
