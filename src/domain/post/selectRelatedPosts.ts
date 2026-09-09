import type { Post } from '@/domain/post/post.model'

/**
 * Choose up to `target` related posts for a post page.
 *
 * Category matches come first (they are the most relevant), then recent posts
 * top the list up so every post keeps a healthy set of outbound internal links
 * even when its category is sparse. The current post and duplicates are removed.
 *
 * Order is deterministic: it preserves the order of `categoryMatches`, then
 * `recentPosts`, so callers control the tie-break by how they sort each list.
 */
export const selectRelatedPosts = (
  categoryMatches: ReadonlyArray<Post>,
  recentPosts: ReadonlyArray<Post>,
  currentPostId: number,
  target: number,
): Post[] => {
  const seen = new Set<number>([currentPostId])
  const selected: Post[] = []

  for (const post of [...categoryMatches, ...recentPosts]) {
    if (selected.length >= target) break
    if (seen.has(post.id)) continue
    seen.add(post.id)
    selected.push(post)
  }

  return selected
}
