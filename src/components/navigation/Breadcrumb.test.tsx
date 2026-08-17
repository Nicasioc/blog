import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Breadcrumb } from './Breadcrumb'

describe('Breadcrumb', () => {
  it('renders a link for items with an href and plain text for the last item', () => {
    render(
      <Breadcrumb
        items={[{ name: 'Home', href: '/' }, { name: 'Blog', href: '/blog' }, { name: 'Post' }]}
      />,
    )

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Blog' })).toHaveAttribute('href', '/blog')
    expect(screen.getByText('Post')).toBeInTheDocument()
  })

  it('never nests a list item inside another list item', () => {
    const { container } = render(
      <Breadcrumb
        items={[{ name: 'Home', href: '/' }, { name: 'Blog', href: '/blog' }, { name: 'Post' }]}
      />,
    )

    expect(container.querySelectorAll('li li')).toHaveLength(0)
  })

  it('renders one separator fewer than the number of items', () => {
    const { container } = render(
      <Breadcrumb
        items={[{ name: 'Home', href: '/' }, { name: 'Blog', href: '/blog' }, { name: 'Post' }]}
      />,
    )

    expect(container.querySelectorAll('[data-slot="breadcrumb-separator"]')).toHaveLength(2)
  })

  it('renders no separator for a single item', () => {
    const { container } = render(<Breadcrumb items={[{ name: 'Home' }]} />)

    expect(container.querySelectorAll('[data-slot="breadcrumb-separator"]')).toHaveLength(0)
  })

  it('renders nothing in the list when there are no items', () => {
    const { container } = render(<Breadcrumb items={[]} />)

    expect(container.querySelectorAll('li')).toHaveLength(0)
  })

  it('renders duplicate item names without collapsing them', () => {
    const { container } = render(
      <Breadcrumb
        items={[{ name: 'Blog', href: '/' }, { name: 'Blog', href: '/blog' }, { name: 'Blog' }]}
      />,
    )

    expect(container.querySelectorAll('[data-slot="breadcrumb-item"]')).toHaveLength(3)
  })
})
