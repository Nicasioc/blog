import { payloadFetch } from '@/persistence/payload/payloadClient'
import { payloadPublicCreate } from '@/persistence/payload/payloadPublicWriteClient'
import {
  mapPayloadCommentToComment,
  buildCommentTree,
} from '@/persistence/payload/mappers/commentMapper'
import { logger } from '@/utils/logger'
import type { PayloadCommentDto } from '@/persistence/payload/types/payloadComment.dto'
import type { Comment, CommentSubmission } from '@/domain/comment/comment.model'

export const fetchCommentsByPostId = async (postId: number): Promise<Comment[]> => {
  const result = await payloadFetch<PayloadCommentDto>('/comments', {
    where: { post: { equals: postId }, status: { equals: 'approved' } },
    limit: 100,
    depth: 0,
    tags: [`comments-${postId}`],
    revalidate: 300,
  })
  const flat = result.data.flatMap((dto) => mapPayloadCommentToComment(dto) ?? [])
  if (flat.length < result.data.length) {
    logger.warn('malformed comments skipped', {
      postId,
      skipped: result.data.length - flat.length,
    })
  }
  return buildCommentTree(flat)
}

// Called by submitComment.ts (the 'use server' action) — keeps the write path
// inside the repository layer rather than issuing fetch from the use case.
// The response is ignored: an anonymous create may not be allowed to read back a pending comment.
export const createComment = async (data: CommentSubmission): Promise<void> => {
  await payloadPublicCreate('/comments', {
    post: data.postId,
    parent: data.parentId,
    authorName: data.authorName,
    authorEmail: data.authorEmail,
    authorUrl: data.authorUrl ?? '',
    content: data.content,
  })
}
