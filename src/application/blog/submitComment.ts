'use server'
import { revalidateTag } from 'next/cache'
import { serverEnv } from '@/lib/env.server'
import { logger } from '@/utils/logger'
import type { CommentSubmission } from '@/domain/comment/comment.model'

export type SubmitCommentResult = { success: true } | { success: false; error: string }

const MAX_NAME = 100
const MAX_EMAIL = 254
const MAX_CONTENT = 5000

const validateSubmission = (data: CommentSubmission): string | null => {
  if (!data.authorName.trim() || data.authorName.length > MAX_NAME)
    return 'Name is required and must be under 100 characters.'
  if (!data.authorEmail.trim() || data.authorEmail.length > MAX_EMAIL)
    return 'A valid email address is required.'
  if (!data.content.trim() || data.content.length > MAX_CONTENT)
    return 'Comment must be between 1 and 5000 characters.'
  if (data.authorUrl) {
    try {
      const { protocol } = new URL(data.authorUrl)
      if (protocol !== 'http:' && protocol !== 'https:') return 'URL must use http or https.'
    } catch {
      return 'Invalid URL format.'
    }
  }
  return null
}

export const submitComment = async (data: CommentSubmission): Promise<SubmitCommentResult> => {
  const validationError = validateSubmission(data)
  if (validationError) return { success: false, error: validationError }

  const response = await fetch(`${serverEnv.WORDPRESS_API_URL}/wp/v2/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      post: data.postId,
      parent: data.parentId ?? 0,
      author_name: data.authorName,
      author_email: data.authorEmail,
      author_url: data.authorUrl ?? '',
      content: data.content,
    }),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const message = typeof body?.message === 'string' ? body.message : `WP error ${response.status}`
    logger.warn('Comment submission failed', { status: response.status, message })
    return { success: false, error: message }
  }

  revalidateTag(`comments-${data.postId}`, { expire: 300 })
  return { success: true }
}
