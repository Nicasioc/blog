import { Separator } from '@/components/ui/separator'
import { CommentItem } from './CommentItem'
import type { Comment } from '@/domain/comment/comment.model'

type Props = { comments: Comment[] }

export const CommentList = ({ comments }: Props) => {
  if (comments.length === 0) return null

  return (
    <section className="mt-12">
      <h2 className="mb-4 text-xl font-bold">
        {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
      </h2>
      <Separator className="mb-6" />
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </section>
  )
}
