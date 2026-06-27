import { PostCard } from './PostCard'
import type { Post } from '@/domain/post/post.model'

type Props = { posts: Post[] }

export const RelatedPosts = ({ posts }: Props) => {
  if (posts.length === 0) return null
  return (
    <section className="mt-12">
      <h2 className="mb-4 text-xl font-bold">Related Posts</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  )
}
