import { Fragment } from 'react'
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
        <Fragment key={`${index}-${item.name}`}>
          <BreadcrumbItem>
            {item.href ? (
              <BreadcrumbLink render={<Link href={item.href} />}>{item.name}</BreadcrumbLink>
            ) : (
              <BreadcrumbPage>{item.name}</BreadcrumbPage>
            )}
          </BreadcrumbItem>
          {index < items.length - 1 && <BreadcrumbSeparator />}
        </Fragment>
      ))}
    </BreadcrumbList>
  </BreadcrumbRoot>
)
