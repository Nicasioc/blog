import { wpFetch } from '@/persistence/wordpress/wpClient'
import {
  mapWpCommentToComment,
  buildCommentTree,
} from '@/persistence/wordpress/mappers/commentMapper'
import type { WpCommentDto } from '@/persistence/wordpress/types/wpComment.dto'
import type { Comment } from '@/domain/comment/comment.model'

export const fetchCommentsByPostId = async (postId: number): Promise<Comment[]> => {
  const result = await wpFetch<WpCommentDto[]>('/wp/v2/comments', {
    params: { post: postId, per_page: 100, status: 'approve' },
    tags: [`comments-${postId}`],
    revalidate: 300,
  })
  const flat = result.data.map(mapWpCommentToComment)
  return buildCommentTree(flat)
}
