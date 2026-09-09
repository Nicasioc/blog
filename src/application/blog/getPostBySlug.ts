import {
  fetchPostBySlug,
  fetchRelatedPosts,
  fetchPostsList,
} from '@/persistence/payload/repositories/postRepository'
import { fetchCommentsByPostId } from '@/persistence/payload/repositories/commentRepository'
import { selectRelatedPosts } from '@/domain/post/selectRelatedPosts'
import type { Post } from '@/domain/post/post.model'
import type { Comment } from '@/domain/comment/comment.model'

export type PostDetailData = {
  post: Post
  relatedPosts: Post[]
  comments: Comment[]
}

// Every post page should carry a healthy set of outbound internal links, even
// when the post sits in a sparse category.
const RELATED_POST_TARGET = 3

const resolveRelatedPosts = async (post: Post, categoryMatches: Post[]): Promise<Post[]> => {
  const fromCategories = selectRelatedPosts(categoryMatches, [], post.id, RELATED_POST_TARGET)
  if (fromCategories.length >= RELATED_POST_TARGET) return fromCategories

  // Top up with the most recent posts. Over-fetch so removing the current post
  // and the category matches still leaves enough candidates.
  const recent = await fetchPostsList({
    perPage: RELATED_POST_TARGET + categoryMatches.length + 1,
  })
  return selectRelatedPosts(categoryMatches, recent.posts, post.id, RELATED_POST_TARGET)
}

export const getPostBySlug = async (slug: string): Promise<PostDetailData | null> => {
  const post = await fetchPostBySlug(slug)
  if (!post) return null

  const [categoryMatches, comments] = await Promise.all([
    fetchRelatedPosts(
      post.categories.map((c) => c.id),
      post.id,
    ),
    fetchCommentsByPostId(post.id),
  ])

  const relatedPosts = await resolveRelatedPosts(post, categoryMatches)

  return { post, relatedPosts, comments }
}
