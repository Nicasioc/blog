import { PostCard } from './PostCard'
import type { Post } from '@/domain/post/post.model'

type Props = { posts: Post[] }

export const RelatedPosts = ({ posts }: Props) => {
  if (posts.length === 0) return null
  return (
    <section className="mt-12">
      <h2 className="text-xl font-bold mb-4">Related Posts</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  )
}
