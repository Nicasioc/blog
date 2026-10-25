'use server'
import { createComment } from '@/persistence/payload/repositories/commentRepository'
import { PayloadApiError } from '@/persistence/payload/payloadError'
import { parseCommentSubmission } from '@/domain/comment/commentSubmission.schema'
import { logger } from '@/utils/logger'
import { detectBotReason } from '@/domain/comment/commentAntiSpam'
import type { CommentSubmissionInput } from '@/domain/comment/comment.model'

export type SubmitCommentResult = { success: true } | { success: false; error: string }

const GENERIC_FAILURE_MESSAGE =
  'Ocurrió un error al enviar tu comentario. Por favor, intenta de nuevo.'

const describeFailure = (error: unknown): Record<string, unknown> =>
  error instanceof PayloadApiError
    ? { status: error.status, endpoint: error.endpoint }
    : { reason: error instanceof Error ? error.message : 'unknown' }

// Typed as CommentSubmissionInput for callers, but the argument is untrusted: a server action
// can be invoked with any payload, so it is re-validated as `unknown`.
export const submitComment = async (data: CommentSubmissionInput): Promise<SubmitCommentResult> => {
  const parsed = parseCommentSubmission(data)
  if (!parsed.success) return { success: false, error: parsed.error }

  const { website, renderedAt, ...submission } = parsed.data

  // Fake success so a bot can't tell it was caught; the comment is silently dropped.
  const botReason = detectBotReason({ website, renderedAt }, Date.now())
  if (botReason) {
    logger.warn('comment dropped', { reason: botReason })
    return { success: true }
  }

  try {
    await createComment(submission)
    return { success: true }
  } catch (error) {
    logger.warn('comment submit failed', describeFailure(error))
    return { success: false, error: GENERIC_FAILURE_MESSAGE }
  }
}
