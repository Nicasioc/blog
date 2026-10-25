'use client'
import { useEffect, useRef, useState, useTransition } from 'react'
import { submitComment } from '@/application/blog/submitComment'
import type { CommentSubmissionInput } from '@/domain/comment/comment.model'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { SectionHeading } from '@/components/layout/SectionHeading'

type Props = { postId: number }

export const CommentForm = ({ postId }: Props) => {
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  // Set on mount, not during render: this component is server-rendered into cached (ISR) HTML,
  // so a render-time timestamp would be the build time rather than when the visitor saw the form.
  const renderedAt = useRef<number | null>(null)

  useEffect(() => {
    renderedAt.current = Date.now()
  }, [])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // The effect has always run by the time a user can submit; this only narrows the type.
    if (renderedAt.current === null) return
    const form = e.currentTarget
    const data = new FormData(form)

    const submission: CommentSubmissionInput = {
      postId,
      renderedAt: renderedAt.current,
      website: (data.get('website') as string | null) ?? '',
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
    <section className="mt-16">
      <SectionHeading eyebrow="Comentarios" title="Dejar un comentario" />
      {status === 'success' ? (
        <p className="bg-muted/40 ring-foreground/10 text-muted-foreground rounded-xl p-5 text-sm ring-1">
          Tu comentario fue enviado y está a la espera de moderación. ¡Gracias!
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-muted/40 ring-foreground/10 relative space-y-4 rounded-xl p-5 ring-1"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="authorName">Nombre</Label>
              <Input id="authorName" name="authorName" required placeholder="Juan Pérez" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="authorEmail">Correo electrónico</Label>
              <Input
                id="authorEmail"
                name="authorEmail"
                type="email"
                required
                placeholder="juan@ejemplo.com"
                aria-describedby="authorEmail-hint"
              />
              <p id="authorEmail-hint" className="text-muted-foreground text-xs">
                No se muestra públicamente.
              </p>
            </div>
          </div>
          <div aria-hidden="true" className="absolute left-[-9999px] h-px w-px overflow-hidden">
            <label htmlFor="website">No completar este campo</label>
            <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Comentario</Label>
            <Textarea
              id="content"
              name="content"
              required
              rows={5}
              placeholder="Comparte tu opinión…"
              className="min-h-32"
            />
          </div>
          {status === 'error' && <p className="text-destructive text-sm">{errorMessage}</p>}
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Enviando…' : 'Publicar comentario'}
          </Button>
        </form>
      )}
    </section>
  )
}
