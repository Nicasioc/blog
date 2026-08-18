import { PageHeader } from '@/components/layout/PageHeader'

type Props = {
  title: string
  description?: string
  children: React.ReactNode
}

export const StaticPageShell = ({ title, description, children }: Props) => (
  <div className="container mx-auto max-w-3xl px-4 py-10">
    <PageHeader title={title} description={description} />
    <div className="prose prose-lg prose-headings:tracking-tight max-w-none">{children}</div>
  </div>
)
