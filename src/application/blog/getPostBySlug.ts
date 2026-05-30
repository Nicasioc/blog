import {
  fetchPostBySlug,
  fetchRelatedPosts,
} from '@/persistence/wordpress/repositories/postRepository'
import { fetchCommentsByPostId } from '@/persistence/wordpress/repositories/commentRepository'
import type { Post } from '@/domain/post/post.model'
import type { Comment } from '@/domain/comment/comment.model'

export type PostDetailData = {
  post: Post
  relatedPosts: Post[]
  comments: Comment[]
}

export const getPostBySlug = async (slug: string): Promise<PostDetailData | null> => {
  const post = await fetchPostBySlug(slug)
  if (!post) return null

  const [relatedPosts, comments] = await Promise.all([
    fetchRelatedPosts(
      post.categories.map((c) => c.id),
      post.id,
    ),
    fetchCommentsByPostId(post.id),
  ])

  return { post, relatedPosts, comments }
}
