import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { Tag } from '@/domain/tag/tag.model'

type Props = { tags: Tag[] }

export const TagList = ({ tags }: Props) => {
  if (tags.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {tags.map((tag) => (
        <Badge key={tag.id} variant="outline" render={<Link href={`/tag/${tag.slug}`} />}>
          {tag.name}
        </Badge>
      ))}
    </div>
  )
}
