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
    return 'El nombre es obligatorio y debe tener menos de 100 caracteres.'
  if (!data.authorEmail.trim() || data.authorEmail.length > MAX_EMAIL)
    return 'Se requiere una dirección de correo electrónico válida.'
  if (!data.content.trim() || data.content.length > MAX_CONTENT)
    return 'El comentario debe tener entre 1 y 5000 caracteres.'
  if (data.authorUrl) {
    try {
      const { protocol } = new URL(data.authorUrl)
      if (protocol !== 'http:' && protocol !== 'https:') return 'La URL debe usar http o https.'
    } catch {
      return 'Formato de URL inválido.'
    }
  }
  return null
}

const GENERIC_FAILURE_MESSAGE =
  'Ocurrió un error al enviar tu comentario. Por favor, intenta de nuevo.'

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
