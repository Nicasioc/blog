import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CommentItem } from './CommentItem'
import type { Comment } from '@/domain/comment/comment.model'

const buildComment = (overrides: Partial<Comment> = {}): Comment => ({
  id: 1,
  postId: 10,
  parentId: null,
  authorName: 'Ana',
  authorUrl: null,
  publishedAt: new Date('2026-01-15T12:00:00Z'),
  content: 'Hola',
  children: [],
  ...overrides,
})

describe('CommentItem', () => {
  it('renders HTML in the content as literal text, not as elements', () => {
    const payload = '<img src=x onerror=alert(1)>'
    const { container } = render(<CommentItem comment={buildComment({ content: payload })} />)

    expect(screen.getByText(payload)).toBeInTheDocument()
    expect(container.querySelector('img')).toBeNull()
  })

  it('renders < and & characters as typed', () => {
    render(<CommentItem comment={buildComment({ content: 'a < b && c <script>x</script>' })} />)

    expect(screen.getByText('a < b && c <script>x</script>')).toBeInTheDocument()
  })

  it('keeps line breaks in the text and styles the paragraph to show them', () => {
    render(<CommentItem comment={buildComment({ content: 'uno\ndos' })} />)

    const paragraph = screen.getByText((_, element) => element?.textContent === 'uno\ndos')
    expect(paragraph.tagName).toBe('P')
    expect(paragraph).toHaveClass('whitespace-pre-line')
  })

  it('renders nested replies', () => {
    const reply = buildComment({ id: 2, parentId: 1, authorName: 'Beto', content: 'Respuesta' })
    render(<CommentItem comment={buildComment({ children: [reply] })} />)

    expect(screen.getByText('Hola')).toBeInTheDocument()
    expect(screen.getByText('Respuesta')).toBeInTheDocument()
    expect(screen.getByText('Beto')).toBeInTheDocument()
  })
})
