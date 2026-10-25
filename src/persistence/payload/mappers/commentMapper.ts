import { isNonEmptyString, isPositiveInteger } from '@/utils/checks'
import type { PayloadCommentDto } from '@/persistence/payload/types/payloadComment.dto'
import type { Comment } from '@/domain/comment/comment.model'

export const ANONYMOUS_AUTHOR = 'Anónimo'

// A relationship field is a bare id at depth 0 but a populated object with an `id` above that.
const toRelationId = (value: unknown): number | null => {
  if (isPositiveInteger(value)) return value
  if (typeof value === 'object' && value !== null && 'id' in value) {
    return isPositiveInteger(value.id) ? value.id : null
  }
  return null
}

const toHttpUrlOrNull = (value: unknown): string | null => {
  if (!isNonEmptyString(value)) return null
  const trimmed = value.trim()
  if (!URL.canParse(trimmed)) return null
  const { protocol } = new URL(trimmed)
  return protocol === 'http:' || protocol === 'https:' ? trimmed : null
}

// The CMS payload crosses a system boundary, so every field is checked at runtime. Returns null
// when the comment can't be shown safely (no usable id, post, content or date).
export const mapPayloadCommentToComment = (dto: PayloadCommentDto): Comment | null => {
  if (!dto || !isPositiveInteger(dto.id)) return null
  const postId = toRelationId(dto.post)
  if (postId === null) return null
  if (!isNonEmptyString(dto.content) || !isNonEmptyString(dto.createdAt)) return null

  const publishedAt = new Date(dto.createdAt)
  if (Number.isNaN(publishedAt.getTime())) return null

  return {
    id: dto.id,
    postId,
    parentId: toRelationId(dto.parent),
    authorName: isNonEmptyString(dto.authorName) ? dto.authorName.trim() : ANONYMOUS_AUTHOR,
    authorUrl: toHttpUrlOrNull(dto.authorUrl),
    publishedAt,
    content: dto.content,
    children: [],
  }
}

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
