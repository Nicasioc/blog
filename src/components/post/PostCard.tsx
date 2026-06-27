import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Post } from '@/domain/post/post.model'

type Props = { post: Post }

export const PostCard = ({ post }: Props) => (
  <Card className="overflow-hidden h-full flex flex-col">
    {post.featuredImage && (
      <div className="relative aspect-video overflow-hidden">
        <Image
          src={post.featuredImage.url}
          alt={post.featuredImage.alt}
          width={post.featuredImage.width}
          height={post.featuredImage.height}
          className="object-cover w-full h-full"
        />
      </div>
    )}
    <CardHeader className="flex-1">
      <div className="flex gap-2 flex-wrap mb-2">
        {post.categories.slice(0, 2).map((cat) => (
          <Badge key={cat.id} variant="default" render={<Link href={`/category/${cat.slug}`} />}>
            {cat.name}
          </Badge>
        ))}
      </div>
      <Link href={`/blog/${post.slug}`}>
        <h2 className="text-lg font-bold leading-snug hover:text-brand-primary line-clamp-2">
          {post.title}
        </h2>
      </Link>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground text-sm line-clamp-3">{post.excerpt}</p>
      <p className="text-xs text-muted-foreground mt-2">
        {post.author.name} &middot;{' '}
        {post.publishedAt.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}
      </p>
    </CardContent>
  </Card>
)
