import type { WpCommentDto } from '@/persistence/wordpress/types/wpComment.dto'
import type { Comment } from '@/domain/comment/comment.model'

export const mapWpCommentToComment = (dto: WpCommentDto): Comment => ({
  id: dto.id,
  postId: dto.post,
  parentId: dto.parent === 0 ? null : dto.parent,
  authorName: dto.author_name,
  authorUrl: dto.author_url || null,
  publishedAt: new Date(dto.date_gmt + 'Z'),
  content: dto.content.rendered,
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
