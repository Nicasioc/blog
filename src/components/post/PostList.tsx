import { PostCard } from './PostCard'
import type { Post } from '@/domain/post/post.model'

type Props = { posts: Post[] }

export const PostList = ({ posts }: Props) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {posts.map((post) => (
      <PostCard key={post.id} post={post} />
    ))}
  </div>
)
