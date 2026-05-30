'use client'
type Props = { html: string; className?: string }

export const ContentHtml = ({ html, className }: Props) => (
  <div dangerouslySetInnerHTML={{ __html: html }} className={className} />
)
