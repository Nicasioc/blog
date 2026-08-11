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

// New in this layer — closes the architecture violation where submitComment.ts
// bypasses the repository pattern and calls fetch directly (WP today). Wiring
// submitComment.ts to actually call this is BLO-79, out of scope here.
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
