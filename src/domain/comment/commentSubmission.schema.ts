import { z } from 'zod'
import type { CommentSubmissionInput } from '@/domain/comment/comment.model'

const MAX_NAME = 100
const MAX_EMAIL = 254
const MAX_CONTENT = 5000
const MAX_HONEYPOT = 2000

const NAME_MESSAGE = 'El nombre es obligatorio y debe tener menos de 100 caracteres.'
const EMAIL_MESSAGE = 'Se requiere una dirección de correo electrónico válida.'
const CONTENT_MESSAGE = 'El comentario debe tener entre 1 y 5000 caracteres.'
const URL_MESSAGE = 'La URL debe usar http o https.'
const INVALID_URL_MESSAGE = 'Formato de URL inválido.'
export const INVALID_SUBMISSION_MESSAGE = 'Los datos del comentario no son válidos.'

const authorUrlSchema = z
  .string(INVALID_URL_MESSAGE)
  .trim()
  .superRefine((value, ctx) => {
    if (value === '') return
    if (!URL.canParse(value)) {
      ctx.addIssue({ code: 'custom', message: INVALID_URL_MESSAGE })
      return
    }
    const { protocol } = new URL(value)
    if (protocol !== 'http:' && protocol !== 'https:') {
      ctx.addIssue({ code: 'custom', message: URL_MESSAGE })
    }
  })

// Optional fields may arrive as `null` from JSON clients; treat that as absent.
const nullToUndefined = <T>(value: T | null | undefined): T | undefined => value ?? undefined

const commentSubmissionSchema = z.object(
  {
    postId: z
      .number(INVALID_SUBMISSION_MESSAGE)
      .int(INVALID_SUBMISSION_MESSAGE)
      .positive(INVALID_SUBMISSION_MESSAGE),
    parentId: z
      .number(INVALID_SUBMISSION_MESSAGE)
      .int(INVALID_SUBMISSION_MESSAGE)
      .positive(INVALID_SUBMISSION_MESSAGE)
      .nullish()
      .transform(nullToUndefined),
    authorName: z.string(NAME_MESSAGE).trim().min(1, NAME_MESSAGE).max(MAX_NAME, NAME_MESSAGE),
    authorEmail: z
      .string(EMAIL_MESSAGE)
      .trim()
      .max(MAX_EMAIL, EMAIL_MESSAGE)
      .pipe(z.email(EMAIL_MESSAGE)),
    authorUrl: authorUrlSchema.nullish().transform(nullToUndefined),
    website: z
      .string(INVALID_SUBMISSION_MESSAGE)
      .max(MAX_HONEYPOT, INVALID_SUBMISSION_MESSAGE)
      .nullish()
      .transform(nullToUndefined),
    renderedAt: z.number(INVALID_SUBMISSION_MESSAGE).finite(INVALID_SUBMISSION_MESSAGE),
    content: z
      .string(CONTENT_MESSAGE)
      .trim()
      .min(1, CONTENT_MESSAGE)
      .max(MAX_CONTENT, CONTENT_MESSAGE),
  },
  INVALID_SUBMISSION_MESSAGE,
)

export type CommentSubmissionParseResult =
  | { success: true; data: CommentSubmissionInput }
  | { success: false; error: string }

// Server actions receive arbitrary client input, so this accepts `unknown` and never throws.
export const parseCommentSubmission = (input: unknown): CommentSubmissionParseResult => {
  const result = commentSubmissionSchema.safeParse(input)
  if (result.success) return { success: true, data: result.data }
  return { success: false, error: result.error.issues[0]?.message ?? INVALID_SUBMISSION_MESSAGE }
}
