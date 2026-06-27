import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Author } from '@/domain/author/author.model'

type Props = { author: Author }

export const AuthorCard = ({ author }: Props) => (
  <div className="mt-8 flex items-start gap-4 rounded-lg border p-4">
    <Avatar size="lg">
      {author.avatarUrl && <AvatarImage src={author.avatarUrl} alt={author.name} />}
      <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
    </Avatar>
    <div>
      <p className="font-semibold">{author.name}</p>
      {author.description && (
        <p className="text-muted-foreground mt-1 text-sm">{author.description}</p>
      )}
    </div>
  </div>
)
