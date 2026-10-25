import { describe, it, expect } from 'vitest'
import { parseCommentSubmission, INVALID_SUBMISSION_MESSAGE } from './commentSubmission.schema'

const valid = {
  postId: 1,
  authorName: 'Alice',
  authorEmail: 'alice@example.com',
  authorUrl: '',
  content: 'Great post!',
  renderedAt: 1_000,
}

describe('parseCommentSubmission', () => {
  it('accepts a valid submission and trims text fields', () => {
    const result = parseCommentSubmission({
      ...valid,
      authorName: '  Alice ',
      authorEmail: ' alice@example.com ',
      content: ' hi ',
      parentId: 4,
    })
    expect(result).toEqual({
      success: true,
      data: { ...valid, authorName: 'Alice', content: 'hi', parentId: 4 },
    })
  })

  it('accepts a missing authorUrl and http/https URLs', () => {
    const { authorUrl: _omitted, ...withoutUrl } = valid
    expect(parseCommentSubmission(withoutUrl)).toMatchObject({ success: true })
    expect(parseCommentSubmission({ ...valid, authorUrl: 'http://example.com' })).toMatchObject({
      success: true,
    })
    expect(parseCommentSubmission({ ...valid, authorUrl: 'https://example.com' })).toMatchObject({
      success: true,
    })
  })

  it.each([null, undefined, 42, 'text', true, []])('rejects a non-object payload (%s)', (input) => {
    expect(parseCommentSubmission(input)).toEqual({
      success: false,
      error: INVALID_SUBMISSION_MESSAGE,
    })
  })

  it.each([
    ['numeric authorName', { authorName: 123 }],
    ['array content', { content: [] }],
    ['null authorEmail', { authorEmail: null }],
    ['object authorName', { authorName: { a: 1 } }],
    ['missing content', { content: undefined }],
  ])('rejects wrongly typed fields without throwing (%s)', (_label, patch) => {
    expect(parseCommentSubmission({ ...valid, ...patch })).toMatchObject({ success: false })
  })

  it('rejects blank and oversized names', () => {
    expect(parseCommentSubmission({ ...valid, authorName: '   ' })).toMatchObject({
      success: false,
    })
    expect(parseCommentSubmission({ ...valid, authorName: 'a'.repeat(101) })).toMatchObject({
      success: false,
    })
  })

  it('rejects blank and oversized content', () => {
    expect(parseCommentSubmission({ ...valid, content: '   ' })).toMatchObject({ success: false })
    expect(parseCommentSubmission({ ...valid, content: 'a'.repeat(5001) })).toMatchObject({
      success: false,
    })
  })

  it.each(['', 'not-an-email', 'a@b', `${'a'.repeat(250)}@x.com`])('rejects email %j', (email) => {
    expect(parseCommentSubmission({ ...valid, authorEmail: email })).toMatchObject({
      success: false,
    })
  })

  it.each(['abc', -1, 0, 1.5])('rejects postId %j', (postId) => {
    expect(parseCommentSubmission({ ...valid, postId })).toMatchObject({ success: false })
  })

  it.each([1.5, -2, 0, '3'])('rejects parentId %j', (parentId) => {
    expect(parseCommentSubmission({ ...valid, parentId })).toMatchObject({ success: false })
  })

  it('reports a format error for a malformed URL and a protocol error for non-http(s)', () => {
    expect(parseCommentSubmission({ ...valid, authorUrl: 'not-a-url' })).toEqual({
      success: false,
      error: 'Formato de URL inválido.',
    })
    expect(parseCommentSubmission({ ...valid, authorUrl: 'ftp://example.com' })).toEqual({
      success: false,
      error: 'La URL debe usar http o https.',
    })
    expect(parseCommentSubmission({ ...valid, authorUrl: 'javascript:alert(1)' })).toMatchObject({
      success: false,
    })
  })

  it('rejects a non-string authorUrl', () => {
    expect(parseCommentSubmission({ ...valid, authorUrl: 5 })).toMatchObject({ success: false })
  })

  it('treats null parentId and authorUrl as absent', () => {
    expect(parseCommentSubmission({ ...valid, parentId: null, authorUrl: null })).toEqual({
      success: true,
      data: { ...valid, parentId: undefined, authorUrl: undefined },
    })
  })

  it('trims authorUrl before validating and returning it', () => {
    expect(parseCommentSubmission({ ...valid, authorUrl: ' https://example.com ' })).toMatchObject({
      success: true,
      data: { authorUrl: 'https://example.com' },
    })
    expect(parseCommentSubmission({ ...valid, authorUrl: '   ' })).toMatchObject({ success: true })
  })

  it('accepts common email shapes and rejects obviously invalid ones', () => {
    expect(
      parseCommentSubmission({ ...valid, authorEmail: 'first.last+tag@sub.example.co' }),
    ).toMatchObject({ success: true })
    expect(parseCommentSubmission({ ...valid, authorEmail: 'a b@example.com' })).toMatchObject({
      success: false,
    })
  })

  it('requires a numeric renderedAt and accepts an optional website', () => {
    expect(parseCommentSubmission({ ...valid, renderedAt: undefined })).toMatchObject({
      success: false,
    })
    expect(parseCommentSubmission({ ...valid, renderedAt: '1000' })).toMatchObject({
      success: false,
    })
    expect(parseCommentSubmission({ ...valid, renderedAt: Infinity })).toMatchObject({
      success: false,
    })
    expect(parseCommentSubmission({ ...valid, website: 'spam' })).toMatchObject({
      success: true,
      data: { website: 'spam' },
    })
    expect(parseCommentSubmission({ ...valid, website: 'a'.repeat(2001) })).toMatchObject({
      success: false,
    })
    expect(parseCommentSubmission({ ...valid, website: 5 })).toMatchObject({ success: false })
  })
})
