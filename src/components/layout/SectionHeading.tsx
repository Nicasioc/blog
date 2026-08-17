import { cn } from '@/lib/utils'

type Props = {
  title: string
  eyebrow?: string
  className?: string
}

export const SectionHeading = ({ title, eyebrow, className }: Props) => (
  <div className={cn('mb-5', className)}>
    {eyebrow && (
      <p className="text-brand-secondary tracking-eyebrow mb-1.5 text-xs font-semibold uppercase">
        {eyebrow}
      </p>
    )}
    <h2 className="text-xl font-bold tracking-tight text-balance">{title}</h2>
    <div className="bg-brand-secondary mt-2.5 h-0.5 w-10 rounded-full" />
  </div>
)
