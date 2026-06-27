import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Post } from '@/domain/post/post.model'

type Props = { post: Post }

export const PostCard = ({ post }: Props) => (
  <Card className="flex h-full flex-col overflow-hidden">
    {post.featuredImage && (
      <div className="relative aspect-video overflow-hidden">
        <Image
          src={post.featuredImage.url}
          alt={post.featuredImage.alt}
          width={post.featuredImage.width}
          height={post.featuredImage.height}
          className="h-full w-full object-cover"
        />
      </div>
    )}
    <CardHeader className="flex-1">
      <div className="mb-2 flex flex-wrap gap-2">
        {post.categories.slice(0, 2).map((cat) => (
          <Badge key={cat.id} variant="default" render={<Link href={`/category/${cat.slug}`} />}>
            {cat.name}
          </Badge>
        ))}
      </div>
      <Link href={`/blog/${post.slug}`}>
        <h2 className="hover:text-brand-primary line-clamp-2 text-lg leading-snug font-bold">
          {post.title}
        </h2>
      </Link>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground line-clamp-3 text-sm">{post.excerpt}</p>
      <p className="text-muted-foreground mt-2 text-xs">
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
