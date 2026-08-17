import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { Tag } from '@/domain/tag/tag.model'

type Props = { tags: Tag[] }

export const TagList = ({ tags }: Props) => {
  if (tags.length === 0) return null
  return (
    <div className="mt-10 flex flex-wrap items-center gap-2 border-t pt-6">
      <span className="text-muted-foreground tracking-eyebrow mr-1 text-xs font-semibold uppercase">
        Tags
      </span>
      {tags.map((tag) => (
        <Badge
          key={tag.id}
          variant="outline"
          className="hover:border-brand-secondary hover:text-brand-secondary transition-colors"
          render={<Link href={`/tag/${tag.slug}`} />}
        >
          {tag.name}
        </Badge>
      ))}
    </div>
  )
}
