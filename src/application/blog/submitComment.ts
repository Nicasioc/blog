'use server'
import { createComment } from '@/persistence/payload/repositories/commentRepository'
import { PayloadApiError } from '@/persistence/payload/payloadError'
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

const GENERIC_FAILURE_MESSAGE = 'Something went wrong submitting your comment. Please try again.'

export const submitComment = async (data: CommentSubmission): Promise<SubmitCommentResult> => {
  const validationError = validateSubmission(data)
  if (validationError) return { success: false, error: validationError }

  try {
    await createComment(data)
    return { success: true }
  } catch (error) {
    if (error instanceof PayloadApiError) return { success: false, error: error.message }
    return { success: false, error: GENERIC_FAILURE_MESSAGE }
  }
}
