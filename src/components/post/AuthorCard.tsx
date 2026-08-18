import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Author } from '@/domain/author/author.model'

type Props = { author: Author }

export const AuthorCard = ({ author }: Props) => (
  <div className="bg-muted/40 ring-foreground/10 mt-10 flex items-start gap-4 rounded-xl p-5 ring-1">
    <Avatar size="lg" className="shrink-0">
      {author.avatarUrl && <AvatarImage src={author.avatarUrl} alt={author.name} />}
      <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
    </Avatar>
    <div className="min-w-0">
      <p className="text-brand-secondary tracking-eyebrow text-xs font-semibold uppercase">
        Escrito por
      </p>
      <p className="mt-0.5 font-semibold">{author.name}</p>
      {author.description && (
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{author.description}</p>
      )}
    </div>
  </div>
)
