import { ContentHtml } from './ContentHtml'
import { AdSlot } from '@/components/ads/AdSlot'
import { splitContentForAd } from '@/domain/post/splitContentForAd'

type Props = { content: string }

const PROSE_CLASS = 'prose prose-lg prose-headings:tracking-tight max-w-[72ch]'

export const PostBody = ({ content }: Props) => {
  const split = splitContentForAd(content)

  if (!split) {
    return (
      <div className={PROSE_CLASS}>
        <ContentHtml html={content} />
      </div>
    )
  }

  return (
    <div className={PROSE_CLASS}>
      <ContentHtml html={split.before} />
      <AdSlot placement="in-content" className="not-prose my-6" />
      <ContentHtml html={split.after} />
    </div>
  )
}
