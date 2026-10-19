import type { ForumTopic } from '@/domain/forum/forumTopic.model'
import { SectionHeading } from '@/components/layout/SectionHeading'

type Props = {
  topics: ForumTopic[]
  forumUrl: string
}

const formatReplies = (count: number): string =>
  count === 1 ? '1 respuesta' : `${count} respuestas`

export const LatestForumTopics = ({ topics, forumUrl }: Props) => {
  if (topics.length === 0) return null
  return (
    <section>
      <SectionHeading title="Últimas del foro" eyebrow="Debate Cuervo" />
      <ul className="divide-border divide-y">
        {topics.map((topic) => (
          <li key={topic.id} className="py-3">
            <a
              href={topic.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-secondary font-medium transition-colors"
            >
              {topic.title}
            </a>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {formatReplies(topic.replyCount)}
            </p>
          </li>
        ))}
      </ul>
      <a
        href={forumUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:text-brand-secondary mt-4 inline-block text-sm font-semibold transition-colors"
      >
        Ir al foro &rarr;
      </a>
    </section>
  )
}
