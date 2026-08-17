import { PostCard } from './PostCard'
import { SectionHeading } from '@/components/layout/SectionHeading'
import type { Post } from '@/domain/post/post.model'

type Props = { posts: Post[] }

export const RelatedPosts = ({ posts }: Props) => {
  if (posts.length === 0) return null
  return (
    <section className="mt-16">
      <SectionHeading eyebrow="Keep reading" title="Related posts" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  )
}
