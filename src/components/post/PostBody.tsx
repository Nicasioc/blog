import { ContentHtml } from './ContentHtml'
import { AdSlot } from '@/components/ads/AdSlot'

type Props = { content: string }

export const PostBody = ({ content }: Props) => {
  const parts = content.split('</p>')
  const splitAt = Math.min(3, Math.floor(parts.length / 2))

  if (splitAt === 0) {
    return (
      <div className="prose prose-lg max-w-none">
        <ContentHtml html={content} />
      </div>
    )
  }

  const before = parts.slice(0, splitAt).join('</p>') + '</p>'
  const after = parts.slice(splitAt).join('</p>')

  return (
    <div className="prose prose-lg max-w-none">
      <ContentHtml html={before} />
      <AdSlot placement="in-content" className="not-prose my-6" />
      <ContentHtml html={after} />
    </div>
  )
}
