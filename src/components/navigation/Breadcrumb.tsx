import Link from 'next/link'
import {
  Breadcrumb as BreadcrumbRoot,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

type Item = { name: string; href?: string }
type Props = { items: Item[] }

export const Breadcrumb = ({ items }: Props) => (
  <BreadcrumbRoot>
    <BreadcrumbList>
      {items.map((item, index) => (
        <BreadcrumbItem key={item.name} className="inline-flex items-center gap-1">
          {item.href ? (
            <BreadcrumbLink render={<Link href={item.href} />}>{item.name}</BreadcrumbLink>
          ) : (
            <BreadcrumbPage>{item.name}</BreadcrumbPage>
          )}
          {index < items.length - 1 && <BreadcrumbSeparator />}
        </BreadcrumbItem>
      ))}
    </BreadcrumbList>
  </BreadcrumbRoot>
)
