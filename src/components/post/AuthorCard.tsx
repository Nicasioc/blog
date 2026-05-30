import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Author } from '@/domain/author/author.model'

type Props = { author: Author }

export const AuthorCard = ({ author }: Props) => (
  <div className="flex items-start gap-4 p-4 rounded-lg border mt-8">
    <Avatar size="lg">
      {author.avatarUrl && <AvatarImage src={author.avatarUrl} alt={author.name} />}
      <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
    </Avatar>
    <div>
      <p className="font-semibold">{author.name}</p>
      {author.description && (
        <p className="text-sm text-muted-foreground mt-1">{author.description}</p>
      )}
    </div>
  </div>
)
