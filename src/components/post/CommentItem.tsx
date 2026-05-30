import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ContentHtml } from './ContentHtml'
import type { Comment } from '@/domain/comment/comment.model'

type Props = { comment: Comment; depth?: number }

export const CommentItem = ({ comment, depth = 0 }: Props) => (
  <div className={`${depth > 0 ? 'ml-8 border-l pl-4' : ''} mt-4`}>
    <div className="flex items-start gap-3">
      <Avatar size="sm" className="shrink-0">
        <AvatarFallback className="text-xs">
          {comment.authorName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-sm">{comment.authorName}</span>
          <span className="text-xs text-muted-foreground">
            {comment.publishedAt.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
        <ContentHtml html={comment.content} className="text-sm prose prose-sm max-w-none" />
      </div>
    </div>
    {comment.children.map((child) => (
      <CommentItem key={child.id} comment={child} depth={depth + 1} />
    ))}
  </div>
)
