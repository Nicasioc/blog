import type { Post } from '@/domain/post/post.model'

const toPostArray = (value: unknown): Post[] => (Array.isArray(value) ? value : [])

const dedupeById = (posts: Post[]): Post[] =>
  posts.filter((post, index) => posts.findIndex((candidate) => candidate.id === post.id) === index)

/*
 * Selects the posts shown in the homepage hero: editorially `featured` posts
 * first (in the order given), then backfilled with `recent` posts until
 * `count` is reached. A post present in both lists appears once, in its
 * featured position — this keeps the hero from ever being empty (falls back
 * to recent) or stale (a single old featured post can't be the only slide).
 */
export const selectHeroPosts = (featured: Post[], recent: Post[], count = 3): Post[] => {
  if (count <= 0) return []

  const featuredPosts = dedupeById(toPostArray(featured)).slice(0, count)
  const featuredIds = new Set(featuredPosts.map((post) => post.id))
  const backfillPosts = toPostArray(recent).filter((post) => !featuredIds.has(post.id))

  return featuredPosts.concat(backfillPosts).slice(0, count)
}
