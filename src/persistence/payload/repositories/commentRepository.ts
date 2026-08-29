import { payloadFetch } from '@/persistence/payload/payloadClient'
import { payloadMutate } from '@/persistence/payload/payloadWriteClient'
import {
  mapPayloadCommentToComment,
  buildCommentTree,
} from '@/persistence/payload/mappers/commentMapper'
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
  const flat = result.data.map(mapPayloadCommentToComment)
  return buildCommentTree(flat)
}

// Called by submitComment.ts (the 'use server' action) — keeps the write path
// inside the repository layer rather than issuing fetch from the use case.
export const createComment = async (data: CommentSubmission): Promise<Comment> => {
  const dto = await payloadMutate<PayloadCommentDto>('/comments', {
    method: 'POST',
    body: {
      post: data.postId,
      parent: data.parentId,
      authorName: data.authorName,
      authorEmail: data.authorEmail,
      authorUrl: data.authorUrl ?? '',
      content: data.content,
    },
  })
  return mapPayloadCommentToComment(dto)
}
