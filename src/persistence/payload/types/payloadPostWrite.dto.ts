// Payload's write path takes the raw Lexical JSON tree for `content`, not the
// computed `contentHtml` field (that's read-only/generated). Converting an HTML or
// Markdown source into Lexical JSON is not solved by this layer — left as `unknown`
// until a write-side caller (BLO-80) needs a concrete shape.
export type PayloadPostWriteDto = {
  title: string
  slug?: string
  excerpt?: string
  content: unknown
  _status: 'draft' | 'published'
  author: number
  categories: number[]
  tags: number[]
}
