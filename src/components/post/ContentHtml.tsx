'use client'
type Props = { html: string; className?: string }

export const ContentHtml = ({ html, className }: Props) => (
  // eslint-disable-next-line react/no-danger -- only for Payload Lexical `contentHtml`: the converter escapes text and runs `sanitizeUrl` on links. Never pass user-submitted text (e.g. comments) here.
  <div dangerouslySetInnerHTML={{ __html: html }} className={className} />
)
