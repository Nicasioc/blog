'use client'
type Props = { html: string; className?: string }

export const ContentHtml = ({ html, className }: Props) => (
  // eslint-disable-next-line react/no-danger -- trusted CMS HTML, sanitized at the API layer
  <div dangerouslySetInnerHTML={{ __html: html }} className={className} />
)
