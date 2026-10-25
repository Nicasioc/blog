export type Comment = {
  id: number
  postId: number
  parentId: number | null
  authorName: string
  authorUrl: string | null
  publishedAt: Date
  content: string
  children: Comment[]
}

export type CommentSubmission = {
  postId: number
  parentId?: number
  authorName: string
  authorEmail: string
  authorUrl?: string
  content: string
}

// What the form sends: the submission plus the anti-spam signals checked server-side.
export type CommentSubmissionInput = CommentSubmission & {
  website?: string
  renderedAt: number
}
