import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPostDate } from '@/domain/post/postDate.utils'
import { cn } from '@/lib/utils'
import type { Post } from '@/domain/post/post.model'

type Props = { post: Post; featured?: boolean }

export const PostCard = ({ post, featured = false }: Props) => (
  <Card
    className={cn(
      'ring-foreground/10 hover:ring-primary/30 group flex h-full flex-col gap-0 overflow-hidden py-0 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg',
      featured && 'md:flex-row md:items-stretch',
    )}
  >
    {post.featuredImage && (
      <div
        className={cn(
          'bg-muted relative overflow-hidden',
          featured ? 'aspect-video md:w-1/2 md:shrink-0' : 'aspect-video',
        )}
      >
        <Image
          src={post.featuredImage.url}
          alt={post.featuredImage.alt}
          width={post.featuredImage.width}
          height={post.featuredImage.height}
          sizes={featured ? '(min-width: 768px) 50vw, 100vw' : '(min-width: 1024px) 33vw, 100vw'}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
    )}
    <div className="flex flex-1 flex-col gap-3 py-5">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap gap-2">
          {post.categories.slice(0, 2).map((cat) => (
            <Badge key={cat.id} variant="default" render={<Link href={`/category/${cat.slug}`} />}>
              {cat.name}
            </Badge>
          ))}
        </div>
        <Link href={`/blog/${post.slug}`} className="group/title">
          <h2
            className={cn(
              'group-hover/title:text-brand-secondary line-clamp-3 leading-snug font-bold text-balance transition-colors',
              featured ? 'text-2xl md:text-3xl' : 'text-lg',
            )}
          >
            {post.title}
          </h2>
        </Link>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <p
          className={cn(
            'text-muted-foreground',
            featured ? 'line-clamp-4 text-base' : 'line-clamp-3 text-sm',
          )}
        >
          {post.excerpt}
        </p>
        {/* mt-auto pins the byline to the card's base so it aligns across a row */}
        <p className="text-muted-foreground mt-auto text-xs">
          <span className="text-foreground/70 font-medium">{post.author.name}</span>
          <span className="mx-1.5">&middot;</span>
          <time dateTime={post.publishedAt.toISOString()}>{formatPostDate(post.publishedAt)}</time>
        </p>
      </CardContent>
    </div>
  </Card>
)
