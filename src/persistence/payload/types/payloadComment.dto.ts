export type PayloadCommentDto = {
  id: number
  post: number
  parent?: number | null
  authorName: string
  authorUrl?: string | null
  content: string
  status?: 'pending' | 'approved' | 'spam' | null
  createdAt: string
}
