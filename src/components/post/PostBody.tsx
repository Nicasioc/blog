import { Fragment } from 'react'
import { ContentHtml } from './ContentHtml'
import { AdSlot } from '@/components/ads/AdSlot'
import { splitContentForAds } from '@/domain/post/splitContentForAd'

type Props = { content: string }

const PROSE_CLASS = 'prose prose-lg prose-headings:tracking-tight max-w-[72ch]'

export const PostBody = ({ content }: Props) => {
  const fragments = splitContentForAds(content)

  return (
    <div className={PROSE_CLASS}>
      {fragments.map((fragment, index) => (
        <Fragment key={index}>
          <ContentHtml html={fragment} />
          {index < fragments.length - 1 && (
            <>
              <AdSlot placement="in-content" className="not-prose my-6 hidden md:block" />
              <AdSlot
                placement="mobile-banner"
                fallbackPlacement="in-content"
                className="not-prose my-6 md:hidden"
              />
            </>
          )}
        </Fragment>
      ))}
    </div>
  )
}
