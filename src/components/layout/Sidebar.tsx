import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { AdSlot } from '@/components/ads/AdSlot'
import type { Category } from '@/domain/category/category.model'

type Props = { categories: Category[] }

export const Sidebar = ({ categories }: Props) => (
  <aside className="space-y-8 lg:sticky lg:top-28 lg:self-start">
    {categories.length > 0 && (
      <section className="bg-muted/40 ring-foreground/10 rounded-xl p-5 ring-1">
        <h3 className="tracking-eyebrow mb-4 text-sm font-semibold uppercase">Categorías</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Badge
              key={cat.id}
              variant="outline"
              className="border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground bg-background transition-colors"
              render={<Link href={`/category/${cat.slug}`} />}
            >
              {cat.name}
            </Badge>
          ))}
        </div>
      </section>
    )}
    <AdSlot placement="sidebar" />
  </aside>
)
