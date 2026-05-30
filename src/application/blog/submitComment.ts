'use server'
import { revalidateTag } from 'next/cache'
import { serverEnv } from '@/lib/env'
import { logger } from '@/utils/logger'
import type { CommentSubmission } from '@/domain/comment/comment.model'

export type SubmitCommentResult = { success: true } | { success: false; error: string }

export const submitComment = async (data: CommentSubmission): Promise<SubmitCommentResult> => {
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
