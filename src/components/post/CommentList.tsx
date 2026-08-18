import { CommentItem } from './CommentItem'
import { SectionHeading } from '@/components/layout/SectionHeading'
import type { Comment } from '@/domain/comment/comment.model'

type Props = { comments: Comment[] }

export const CommentList = ({ comments }: Props) => {
  if (comments.length === 0) return null

  return (
    <section className="mt-16">
      <SectionHeading
        eyebrow="Comentarios"
        title={`${comments.length} ${comments.length === 1 ? 'comentario' : 'comentarios'}`}
      />
      <div className="divide-border divide-y">
        {comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </div>
    </section>
  )
}
