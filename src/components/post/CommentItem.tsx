import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ContentHtml } from './ContentHtml'
import { formatPostDate } from '@/domain/post/postDate.utils'
import { cn } from '@/lib/utils'
import type { Comment } from '@/domain/comment/comment.model'

type Props = { comment: Comment; depth?: number }

export const CommentItem = ({ comment, depth = 0 }: Props) => (
  <div className={cn('py-5', depth > 0 && 'mt-4 ml-6 border-l pl-5 sm:ml-10')}>
    <div className="flex items-start gap-3">
      <Avatar size="sm" className="shrink-0">
        <AvatarFallback className="text-xs">
          {comment.authorName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-sm font-semibold">{comment.authorName}</span>
          <time
            dateTime={comment.publishedAt.toISOString()}
            className="text-muted-foreground text-xs"
          >
            {formatPostDate(comment.publishedAt)}
          </time>
        </div>
        <ContentHtml html={comment.content} className="prose prose-sm max-w-none text-sm" />
      </div>
    </div>
    {comment.children.map((child) => (
      <CommentItem key={child.id} comment={child} depth={depth + 1} />
    ))}
  </div>
)
