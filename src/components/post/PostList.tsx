import { PostCard } from './PostCard'
import type { Post } from '@/domain/post/post.model'

type Props = { posts: Post[]; emptyMessage?: string }

export const PostList = ({ posts, emptyMessage = 'Todavía no hay publicaciones.' }: Props) => {
  if (posts.length === 0) {
    return (
      <p className="bg-muted/40 ring-foreground/10 text-muted-foreground rounded-xl p-8 text-center text-sm ring-1">
        {emptyMessage}
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
