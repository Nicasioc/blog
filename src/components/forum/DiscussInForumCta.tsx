type Props = {
  forumUrl: string | undefined
}

export const DiscussInForumCta = ({ forumUrl }: Props) => {
  if (!forumUrl) return null
  return (
    <aside className="bg-muted my-8 rounded-xl p-5">
      <p className="font-semibold">¿Qué opinás de esta nota?</p>
      <p className="text-muted-foreground mt-1 text-sm">
        Seguí la charla con otros hinchas en el foro.
      </p>
      <a
        href={forumUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:text-brand-secondary mt-3 inline-block text-sm font-semibold transition-colors"
      >
        Discutilo en el foro &rarr;
      </a>
    </aside>
  )
}
