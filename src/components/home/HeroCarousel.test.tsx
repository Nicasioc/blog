import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HeroCarousel } from './HeroCarousel'
import type { Post } from '@/domain/post/post.model'

const makePost = (overrides: Partial<Post> = {}): Post =>
  ({
    id: 1,
    slug: 'post-1',
    title: 'Post title',
    excerpt: 'Excerpt',
    content: '',
    publishedAt: new Date(),
    modifiedAt: new Date(),
    featured: false,
    featuredImage: null,
    author: { id: 1, slug: 'a', name: 'A', description: '', avatarUrl: null, profileUrl: '' },
    categories: [],
    tags: [],
    canonicalUrl: '',
    seo: null,
    ...overrides,
  }) as Post

class IntersectionObserverStub {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = vi.fn(() => [])
  constructor(_callback: IntersectionObserverCallback) {}
}

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', IntersectionObserverStub)
  Element.prototype.scrollTo = vi.fn()
})

describe('HeroCarousel', () => {
  it('renders nothing when there are no posts', () => {
    const { container } = render(<HeroCarousel posts={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders one slide per post', () => {
    render(<HeroCarousel posts={[makePost({ id: 1 }), makePost({ id: 2 }), makePost({ id: 3 })]} />)
    expect(screen.getAllByRole('group')).toHaveLength(3)
  })

  it('renders one dot per post', () => {
    render(<HeroCarousel posts={[makePost({ id: 1 }), makePost({ id: 2 })]} />)
    expect(screen.getAllByRole('button', { name: /Ir a la diapositiva/ })).toHaveLength(2)
  })

  it('hides arrows and dots for a single post', () => {
    render(<HeroCarousel posts={[makePost()]} />)
    expect(screen.queryByLabelText('Diapositiva anterior')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Diapositiva siguiente')).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Ir a la diapositiva/)).not.toBeInTheDocument()
  })

  it('disables the previous arrow on the first slide, not the next', () => {
    render(<HeroCarousel posts={[makePost({ id: 1 }), makePost({ id: 2 })]} />)
    expect(screen.getByLabelText('Diapositiva anterior')).toBeDisabled()
    expect(screen.getByLabelText('Diapositiva siguiente')).not.toBeDisabled()
  })

  it('renders the bg-primary fallback when a post has no featured image', () => {
    const { container } = render(<HeroCarousel posts={[makePost({ featuredImage: null })]} />)
    expect(container.querySelector('.bg-primary')).toBeInTheDocument()
  })

  it('links each slide to the post', () => {
    render(<HeroCarousel posts={[makePost({ slug: 'my-post' })]} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/blog/my-post')
  })
})
