import { describe, it, expect } from 'vitest'
import { mapWpCategoryToCategory } from '@/persistence/wordpress/mappers/categoryMapper'

describe('mapWpCategoryToCategory', () => {
  it('maps all fields correctly', () => {
    const category = mapWpCategoryToCategory({
      id: 5,
      slug: 'la-liga',
      name: 'La Liga',
      description: 'Spanish football',
      count: 42,
      link: 'https://wp.com/category/la-liga',
    })
    expect(category.id).toBe(5)
    expect(category.slug).toBe('la-liga')
    expect(category.postCount).toBe(42)
  })
})
