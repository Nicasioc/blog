import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { AdSlot } from '@/components/ads/AdSlot'
import type { Category } from '@/domain/category/category.model'

type Props = { categories: Category[] }

export const Sidebar = ({ categories }: Props) => (
  <aside className="space-y-6">
    {categories.length > 0 && (
      <div>
        <h3 className="mb-3 font-semibold">Categories</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Badge
              key={cat.id}
              variant="outline"
              className="border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
              render={<Link href={`/category/${cat.slug}`} />}
            >
              {cat.name}
            </Badge>
          ))}
        </div>
      </div>
    )}
    <AdSlot placement="sidebar" />
  </aside>
)
