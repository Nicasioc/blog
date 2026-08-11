import type { PayloadCommentDto } from '@/persistence/payload/types/payloadComment.dto'
import type { Comment } from '@/domain/comment/comment.model'

export const mapPayloadCommentToComment = (dto: PayloadCommentDto): Comment => ({
  id: dto.id,
  postId: dto.post,
  parentId: dto.parent ?? null,
  authorName: dto.authorName,
  authorUrl: dto.authorUrl || null,
  publishedAt: new Date(dto.createdAt),
  content: dto.content,
  children: [],
})

export const buildCommentTree = (flat: Comment[]): Comment[] => {
  const map = new Map<number, Comment>()
  const roots: Comment[] = []

  for (const c of flat) {
    map.set(c.id, { ...c, children: [] })
  }

  for (const c of map.values()) {
    if (c.parentId === null) {
      roots.push(c)
    } else {
      const parent = map.get(c.parentId)
      if (parent) {
        parent.children.push(c)
      } else {
        roots.push(c)
      }
    }
  }

  return roots
}
