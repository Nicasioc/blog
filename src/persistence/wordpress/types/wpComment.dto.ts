export type WpCommentDto = {
  id: number
  post: number
  parent: number
  author_name: string
  author_url: string
  date_gmt: string
  content: { rendered: string }
  status: 'approved' | 'hold' | 'spam' | 'trash'
}
