import { cn } from '@/lib/utils'

type Props = {
  title: string
  eyebrow?: string
  description?: string
  className?: string
}

export const PageHeader = ({ title, eyebrow, description, className }: Props) => (
  <header className={cn('mb-8 border-b pb-6', className)}>
    {eyebrow && (
      <p className="text-brand-secondary tracking-eyebrow mb-2 text-xs font-semibold uppercase">
        {eyebrow}
      </p>
    )}
    <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">{title}</h1>
    {description && (
      <p className="text-muted-foreground mt-3 max-w-2xl text-base leading-relaxed">
        {description}
      </p>
    )}
  </header>
)
