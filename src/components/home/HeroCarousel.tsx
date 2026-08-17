'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Post } from '@/domain/post/post.model'

type Props = { posts: Post[] }

export const HeroCarousel = ({ posts }: Props) => {
  const trackRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<(HTMLElement | null)[]>([])
  const [activeIndex, setActiveIndex] = useState(0)

  const showControls = posts.length > 1

  useEffect(() => {
    const track = trackRef.current
    if (!track || !showControls) return

    // Reports the visible slide directly from scroll position — correct whether the
    // user clicked an arrow/dot or swiped natively, with no debouncing to get wrong.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting)
        if (!visible) return
        const index = slideRefs.current.findIndex((slide) => slide === visible.target)
        if (index !== -1) setActiveIndex(index)
      },
      { root: track, threshold: 0.5 },
    )

    slideRefs.current.forEach((slide) => slide && observer.observe(slide))
    return () => observer.disconnect()
  }, [showControls])

  if (posts.length === 0) return null

  const scrollToIndex = (index: number) => {
    const track = trackRef.current
    if (!track) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    track.scrollTo({
      left: index * track.clientWidth,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    })
  }

  return (
    <section aria-roledescription="carousel" aria-label="Publicaciones destacadas">
      <div className="relative">
        <div
          ref={trackRef}
          className="flex snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden"
        >
          {posts.map((post, index) => (
            <article
              key={post.id}
              ref={(el) => {
                slideRefs.current[index] = el
              }}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} de ${posts.length}`}
              className="w-full shrink-0 snap-center"
            >
              <Link href={`/blog/${post.slug}`} className="group block">
                <div className="relative aspect-[21/9] overflow-hidden rounded-xl md:aspect-[3/1]">
                  {post.featuredImage ? (
                    <>
                      <Image
                        src={post.featuredImage.url}
                        alt={post.featuredImage.alt}
                        fill
                        sizes="(min-width: 1024px) 66vw, 100vw"
                        priority={index === 0}
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    </>
                  ) : (
                    <div className="bg-primary absolute inset-0" />
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                    {post.categories[0] && (
                      <Badge
                        variant={post.featuredImage ? 'default' : 'secondary'}
                        className="mb-3"
                      >
                        {post.categories[0].name}
                      </Badge>
                    )}
                    <h2
                      className={cn(
                        'text-2xl font-bold text-balance md:text-4xl',
                        post.featuredImage ? 'text-white' : 'text-primary-foreground',
                      )}
                    >
                      {post.title}
                    </h2>
                    <p
                      className={cn(
                        'mt-2 hidden line-clamp-2 md:block',
                        post.featuredImage ? 'text-white/80' : 'text-primary-foreground/80',
                      )}
                    >
                      {post.excerpt}
                    </p>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>

        {showControls && (
          <>
            <Button
              variant="secondary"
              size="icon"
              aria-label="Diapositiva anterior"
              disabled={activeIndex === 0}
              onClick={() => scrollToIndex(activeIndex - 1)}
              className="absolute top-1/2 left-2 -translate-y-1/2"
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              aria-label="Diapositiva siguiente"
              disabled={activeIndex === posts.length - 1}
              onClick={() => scrollToIndex(activeIndex + 1)}
              className="absolute top-1/2 right-2 -translate-y-1/2"
            >
              <ChevronRightIcon />
            </Button>
          </>
        )}
      </div>

      {showControls && (
        <div className="mt-3 flex justify-center gap-2">
          {posts.map((post, index) => (
            <button
              key={post.id}
              type="button"
              aria-label={`Ir a la diapositiva ${index + 1}`}
              aria-current={index === activeIndex ? 'true' : undefined}
              onClick={() => scrollToIndex(index)}
              className={cn(
                'size-2 rounded-full transition-colors',
                index === activeIndex ? 'bg-primary' : 'bg-muted-foreground/30',
              )}
            />
          ))}
        </div>
      )}
    </section>
  )
}
