'use client'
import { useState, useTransition } from 'react'
import { submitComment } from '@/application/blog/submitComment'
import type { CommentSubmission } from '@/domain/comment/comment.model'
import { Button } from '@/components/ui/button'

type Props = { postId: number }

export const CommentForm = ({ postId }: Props) => {
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)

    const submission: CommentSubmission = {
      postId,
      authorName: (data.get('authorName') as string).trim(),
      authorEmail: (data.get('authorEmail') as string).trim(),
      content: (data.get('content') as string).trim(),
    }

    startTransition(async () => {
      const result = await submitComment(submission)
      if (result.success) {
        setStatus('success')
        form.reset()
      } else {
        setStatus('error')
        setErrorMessage(result.error)
      }
    })
  }

  return (
    <section className="mt-12">
      <h2 className="mb-4 text-xl font-bold">Leave a Comment</h2>
      {status === 'success' ? (
        <p className="text-muted-foreground rounded-lg border p-4 text-sm">
          Your comment has been submitted and is awaiting moderation. Thank you!
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <input
              name="authorName"
              required
              placeholder="Name *"
              className="focus:ring-brand-primary w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
            />
            <input
              name="authorEmail"
              type="email"
              required
              placeholder="Email * (not displayed)"
              className="focus:ring-brand-primary w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
            />
          </div>
          <textarea
            name="content"
            required
            rows={5}
            placeholder="Your comment..."
            className="focus:ring-brand-primary w-full resize-none rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
          />
          {status === 'error' && <p className="text-destructive text-sm">{errorMessage}</p>}
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Submitting…' : 'Post Comment'}
          </Button>
        </form>
      )}
    </section>
  )
}
