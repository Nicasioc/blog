import { PostCard } from './PostCard'
import { AdSlot } from '@/components/ads/AdSlot'
import { insertAdMarker, isAdMarker } from '@/domain/post/insertAdIntoList'
import type { Post } from '@/domain/post/post.model'

type Props = { posts: Post[]; emptyMessage?: string }

// 2 = after the 3rd card (0-based index) — one full row on `lg`.
const IN_FEED_AFTER_INDEX = 2

export const PostList = ({ posts, emptyMessage = 'Todavía no hay publicaciones.' }: Props) => {
  if (posts.length === 0) {
    return (
      <p className="bg-muted/40 ring-foreground/10 text-muted-foreground rounded-xl p-8 text-center text-sm ring-1">
        {emptyMessage}
      </p>
    )
  }

  const items = insertAdMarker(posts, IN_FEED_AFTER_INDEX)

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) =>
        isAdMarker(item) ? (
          <AdSlot
            key="in-feed-ad"
            placement="in-feed"
            className="bg-card ring-foreground/10 flex items-center justify-center overflow-hidden rounded-xl ring-1"
          />
        ) : (
          <PostCard key={item.id} post={item} />
        ),
      )}
    </div>
  )
}
