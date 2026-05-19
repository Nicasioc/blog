# Phase 6: UI Components & Ad System

## Context

Phase 6 builds all UI components and the pluggable ad abstraction layer. Routes from Phase 5 have placeholder `<main>` content — this phase replaces them with real layouts composed from shadcn primitives. The ad system is designed to be provider-agnostic from day one: changing `NEXT_PUBLIC_AD_PROVIDER` swaps the provider without touching any page or component.

**shadcn components already installed (from Phase 1):** `button card badge avatar separator skeleton breadcrumb pagination`

---

## File Structure

```
src/
├── services/ads/
│   └── adConfig.ts                    ← placement types + sizes + slot IDs
├── components/
│   ├── ads/
│   │   ├── AdProvider.tsx             ← 'use client'; React context; reads NEXT_PUBLIC_AD_PROVIDER
│   │   ├── AdSlot.tsx                 ← 'use client'; calls useAdProvider().renderSlot()
│   │   └── providers/
│   │       ├── AdSenseProvider.tsx    ← 'use client'; adsbygoogle.push({}) per slot
│   │       └── PrebidProvider.tsx     ← 'use client'; stub for future header bidding
│   ├── layout/
│   │   ├── SiteLogo.tsx
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Sidebar.tsx
│   ├── post/
│   │   ├── ContentHtml.tsx            ← 'use client'; dangerouslySetInnerHTML
│   │   ├── PostCard.tsx
│   │   ├── PostList.tsx
│   │   ├── PostBody.tsx               ← Server Component; splits HTML; injects AdSlot
│   │   ├── AuthorCard.tsx
│   │   ├── RelatedPosts.tsx
│   │   ├── CommentItem.tsx            ← new; Server Component; recursive
│   │   ├── CommentList.tsx            ← new; Server Component
│   │   └── CommentForm.tsx            ← new; 'use client'; uses Server Action
│   └── navigation/
│       ├── TagList.tsx
│       ├── Breadcrumb.tsx
│       └── Pagination.tsx
└── app/
    └── providers.tsx                  ← 'use client'; wraps AdProvider for layout.tsx
```

---

## Step 1 — Ad Config (`src/services/ads/adConfig.ts`)

```typescript
import { clientEnv } from '@/lib/env'

export type AdPlacement = 'header-leaderboard' | 'in-content' | 'sidebar' | 'footer'

export type AdSlotConfig = {
  placement: AdPlacement
  sizes: Array<[number, number]>
  adUnitId: string // AdSense slot ID — configure per deployment
}

export const AD_PLACEMENTS: Record<AdPlacement, AdSlotConfig> = {
  'header-leaderboard': {
    placement: 'header-leaderboard',
    sizes: [
      [728, 90],
      [970, 90],
    ],
    adUnitId: clientEnv.NEXT_PUBLIC_ADSENSE_SLOT_HEADER,
  },
  'in-content': {
    placement: 'in-content',
    sizes: [
      [300, 250],
      [336, 280],
    ],
    adUnitId: clientEnv.NEXT_PUBLIC_ADSENSE_SLOT_IN_CONTENT,
  },
  sidebar: {
    placement: 'sidebar',
    sizes: [
      [300, 250],
      [300, 600],
    ],
    adUnitId: clientEnv.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR,
  },
  footer: {
    placement: 'footer',
    sizes: [
      [728, 90],
      [970, 90],
    ],
    adUnitId: clientEnv.NEXT_PUBLIC_ADSENSE_SLOT_FOOTER,
  },
}
```

**New optional env vars** (add to `clientEnv` schema as `z.string().optional().default('')`):

```
NEXT_PUBLIC_ADSENSE_SLOT_HEADER=
NEXT_PUBLIC_ADSENSE_SLOT_IN_CONTENT=
NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR=
NEXT_PUBLIC_ADSENSE_SLOT_FOOTER=
```

---

## Step 2 — Ad Abstraction Layer

### `src/components/ads/AdProvider.tsx`

```typescript
'use client'
import { createContext, useContext, type ReactNode } from 'react'
import { AdSenseSlot } from './providers/AdSenseProvider'
import type { AdPlacement } from '@/services/ads/adConfig'
import { clientEnv } from '@/lib/env'

type AdProviderContextValue = {
  renderSlot: (placement: AdPlacement, className?: string) => ReactNode
}

const AdContext = createContext<AdProviderContextValue>({ renderSlot: () => null })

export const useAdProvider = () => useContext(AdContext)

export const AdProvider = ({ children }: { children: ReactNode }) => {
  const provider = clientEnv.NEXT_PUBLIC_AD_PROVIDER

  const renderSlot = (placement: AdPlacement, className?: string): ReactNode => {
    switch (provider) {
      case 'adsense':
        return <AdSenseSlot placement={placement} className={className} />
      default:
        return null
    }
  }

  return <AdContext.Provider value={{ renderSlot }}>{children}</AdContext.Provider>
}
```

### `src/components/ads/AdSlot.tsx`

```typescript
'use client'
import { useAdProvider } from './AdProvider'
import type { AdPlacement } from '@/services/ads/adConfig'

type Props = { placement: AdPlacement; className?: string }

export const AdSlot = ({ placement, className }: Props) => {
  const { renderSlot } = useAdProvider()
  return <>{renderSlot(placement, className)}</>
}
```

### `src/components/ads/providers/AdSenseProvider.tsx`

```typescript
'use client'
import { useEffect } from 'react'
import { siteConfig } from '@/lib/siteConfig'
import { AD_PLACEMENTS, type AdPlacement } from '@/services/ads/adConfig'

type Props = { placement: AdPlacement; className?: string }

export const AdSenseSlot = ({ placement, className }: Props) => {
  const config = AD_PLACEMENTS[placement]

  useEffect(() => {
    try {
      ;(window as any).adsbygoogle = (window as any).adsbygoogle || []
      ;(window as any).adsbygoogle.push({})
    } catch {
      // adsbygoogle not yet loaded — script fires push() when ready
    }
  }, [])

  if (!config.adUnitId || !siteConfig.adSensePublisherId) return null

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={siteConfig.adSensePublisherId}
        data-ad-slot={config.adUnitId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  )
}
```

### `src/components/ads/providers/PrebidProvider.tsx`

```typescript
'use client'
// Stub — implement when adding header bidding (GAM + Prebid.js)
// Flip NEXT_PUBLIC_AD_PROVIDER=prebid and add implementation here.
// AdSlot interface stays unchanged.
import type { AdPlacement } from '@/services/ads/adConfig'

type Props = { placement: AdPlacement; className?: string }

export const PrebidSlot = ({ placement, className }: Props) => (
  <div className={className} data-placement={placement} />
)
```

### `app/providers.tsx`

```typescript
'use client'
import { AdProvider } from '@/components/ads/AdProvider'
import type { ReactNode } from 'react'

export const Providers = ({ children }: { children: ReactNode }) => (
  <AdProvider>{children}</AdProvider>
)
```

**Update `app/layout.tsx`** — wrap `{children}` with `<Providers>`:

```typescript
import { Providers } from './providers'
// In RootLayout body:
<body>
  <Providers>{children}</Providers>
  {/* AdSense script tag */}
</body>
```

---

## Step 3 — Layout Components

### `src/components/layout/SiteLogo.tsx`

```typescript
import Image from 'next/image'
import Link from 'next/link'
import { siteConfig } from '@/lib/siteConfig'

export const SiteLogo = () => (
  <Link href="/" aria-label={siteConfig.siteName}>
    <Image
      src={siteConfig.logoUrl}
      alt={siteConfig.siteName}
      width={120}
      height={40}
      priority
    />
  </Link>
)
```

### `src/components/layout/Header.tsx`

```typescript
import Link from 'next/link'
import { SiteLogo } from './SiteLogo'
import { AdSlot } from '@/components/ads/AdSlot'

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Blog', href: '/blog' },
]

export const Header = () => (
  <header className="border-b bg-background">
    <div className="container mx-auto px-4 py-3 flex items-center justify-between">
      <SiteLogo />
      <nav className="flex gap-6">
        {NAV_LINKS.map(({ label, href }) => (
          <Link key={href} href={href} className="text-sm font-medium hover:text-brand-primary">
            {label}
          </Link>
        ))}
      </nav>
    </div>
    <div className="container mx-auto px-4 py-2 flex justify-center">
      <AdSlot placement="header-leaderboard" />
    </div>
  </header>
)
```

### `src/components/layout/Footer.tsx`

```typescript
import { siteConfig } from '@/lib/siteConfig'
import { AdSlot } from '@/components/ads/AdSlot'

export const Footer = () => (
  <footer className="border-t bg-muted/40 mt-12">
    <div className="container mx-auto px-4 py-4 flex justify-center">
      <AdSlot placement="footer" />
    </div>
    <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
      &copy; {new Date().getFullYear()} {siteConfig.siteName}
    </div>
  </footer>
)
```

### `src/components/layout/Sidebar.tsx`

```typescript
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { AdSlot } from '@/components/ads/AdSlot'
import type { Category } from '@/domain/category/category.model'

type Props = { categories: Category[] }

export const Sidebar = ({ categories }: Props) => (
  <aside className="space-y-6">
    {categories.length > 0 && (
      <div>
        <h3 className="font-semibold mb-3">Categories</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Badge key={cat.id} variant="outline" asChild>
              <Link href={`/category/${cat.slug}`}>{cat.name}</Link>
            </Badge>
          ))}
        </div>
      </div>
    )}
    <AdSlot placement="sidebar" />
  </aside>
)
```

---

## Step 4 — Post Components

### `src/components/post/ContentHtml.tsx`

```typescript
'use client'
type Props = { html: string; className?: string }
export const ContentHtml = ({ html, className }: Props) => (
  <div dangerouslySetInnerHTML={{ __html: html }} className={className} />
)
```

### `src/components/post/PostCard.tsx`

```typescript
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Post } from '@/domain/post/post.model'

type Props = { post: Post }

export const PostCard = ({ post }: Props) => (
  <Card className="overflow-hidden h-full flex flex-col">
    {post.featuredImage && (
      <div className="relative aspect-video overflow-hidden">
        <Image
          src={post.featuredImage.url}
          alt={post.featuredImage.alt}
          width={post.featuredImage.width}
          height={post.featuredImage.height}
          className="object-cover w-full h-full"
        />
      </div>
    )}
    <CardHeader className="flex-1">
      <div className="flex gap-2 flex-wrap mb-2">
        {post.categories.slice(0, 2).map((cat) => (
          <Badge key={cat.id} variant="secondary" asChild>
            <Link href={`/category/${cat.slug}`}>{cat.name}</Link>
          </Badge>
        ))}
      </div>
      <Link href={`/blog/${post.slug}`}>
        <h2 className="text-lg font-bold leading-snug hover:text-brand-primary line-clamp-2">
          {post.title}
        </h2>
      </Link>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground text-sm line-clamp-3">{post.excerpt}</p>
      <p className="text-xs text-muted-foreground mt-2">
        {post.author.name} &middot;{' '}
        {post.publishedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
      </p>
    </CardContent>
  </Card>
)
```

**CLS note:** `width` and `height` are set explicitly from `featuredImage` metadata — prevents layout shift.

### `src/components/post/PostList.tsx`

```typescript
import { PostCard } from './PostCard'
import type { Post } from '@/domain/post/post.model'

type Props = { posts: Post[] }

export const PostList = ({ posts }: Props) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {posts.map((post) => (
      <PostCard key={post.id} post={post} />
    ))}
  </div>
)
```

### `src/components/post/PostBody.tsx`

```typescript
import { ContentHtml } from './ContentHtml'
import { AdSlot } from '@/components/ads/AdSlot'

type Props = { content: string }

export const PostBody = ({ content }: Props) => {
  const parts = content.split('</p>')
  const splitAt = Math.min(3, Math.floor(parts.length / 2))
  const before = parts.slice(0, splitAt).join('</p>') + (splitAt < parts.length ? '</p>' : '')
  const after = parts.slice(splitAt).join('</p>')

  return (
    <div className="prose prose-lg max-w-none">
      <ContentHtml html={before} />
      <AdSlot placement="in-content" className="my-6 not-prose" />
      <ContentHtml html={after} />
    </div>
  )
}
```

`not-prose` prevents Tailwind Typography from styling the ad container.

### `src/components/post/AuthorCard.tsx`

```typescript
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Author } from '@/domain/author/author.model'

type Props = { author: Author }

export const AuthorCard = ({ author }: Props) => (
  <div className="flex items-start gap-4 p-4 rounded-lg border mt-8">
    <Avatar className="h-12 w-12">
      {author.avatarUrl && <AvatarImage src={author.avatarUrl} alt={author.name} />}
      <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
    </Avatar>
    <div>
      <p className="font-semibold">{author.name}</p>
      {author.description && (
        <p className="text-sm text-muted-foreground mt-1">{author.description}</p>
      )}
    </div>
  </div>
)
```

### `src/components/post/RelatedPosts.tsx`

```typescript
import { PostCard } from './PostCard'
import type { Post } from '@/domain/post/post.model'

type Props = { posts: Post[] }

export const RelatedPosts = ({ posts }: Props) => {
  if (posts.length === 0) return null
  return (
    <section className="mt-12">
      <h2 className="text-xl font-bold mb-4">Related Posts</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  )
}
```

---

## Step 5 — Navigation Components

### `src/components/navigation/TagList.tsx`

```typescript
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { Tag } from '@/domain/tag/tag.model'

type Props = { tags: Tag[] }

export const TagList = ({ tags }: Props) => {
  if (tags.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {tags.map((tag) => (
        <Badge key={tag.id} variant="outline" asChild>
          <Link href={`/tag/${tag.slug}`}>{tag.name}</Link>
        </Badge>
      ))}
    </div>
  )
}
```

### `src/components/navigation/Pagination.tsx`

```typescript
import {
  Pagination as PaginationRoot,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import type { PaginationInfo } from '@/domain/shared/pagination.model'

type Props = { pagination: PaginationInfo; basePath: string }

const buildPageUrl = (basePath: string, page: number) =>
  page === 1 ? basePath : `${basePath}?page=${page}`

export const Pagination = ({ pagination, basePath }: Props) => {
  const { currentPage, totalPages } = pagination
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <PaginationRoot className="mt-8">
      <PaginationContent>
        {currentPage > 1 && (
          <PaginationItem>
            <PaginationPrevious href={buildPageUrl(basePath, currentPage - 1)} />
          </PaginationItem>
        )}
        {pages.map((page) => (
          <PaginationItem key={page}>
            <PaginationLink href={buildPageUrl(basePath, page)} isActive={page === currentPage}>
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}
        {currentPage < totalPages && (
          <PaginationItem>
            <PaginationNext href={buildPageUrl(basePath, currentPage + 1)} />
          </PaginationItem>
        )}
      </PaginationContent>
    </PaginationRoot>
  )
}
```

### `src/components/navigation/Breadcrumb.tsx`

```typescript
import Link from 'next/link'
import {
  Breadcrumb as BreadcrumbRoot,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

type Item = { name: string; href?: string }
type Props = { items: Item[] }

export const Breadcrumb = ({ items }: Props) => (
  <BreadcrumbRoot>
    <BreadcrumbList>
      {items.map((item, index) => (
        <>
          <BreadcrumbItem key={item.name}>
            {item.href ? (
              <BreadcrumbLink asChild>
                <Link href={item.href}>{item.name}</Link>
              </BreadcrumbLink>
            ) : (
              <BreadcrumbPage>{item.name}</BreadcrumbPage>
            )}
          </BreadcrumbItem>
          {index < items.length - 1 && <BreadcrumbSeparator key={`sep-${item.name}`} />}
        </>
      ))}
    </BreadcrumbList>
  </BreadcrumbRoot>
)
```

---

## Step 6 — Update Routes (Replace Placeholders)

Replace Phase 5 placeholder content in each route with real components.

### `app/page.tsx` (homepage)

```typescript
import { getHomepageData } from '@/application/blog/getHomepageData'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Sidebar } from '@/components/layout/Sidebar'
import { PostCard } from '@/components/post/PostCard'
import { PostList } from '@/components/post/PostList'

export const revalidate = 1800

export default async function HomePage() {
  const { featuredPost, recentPosts, categories } = await getHomepageData()
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
          <div className="space-y-8">
            {featuredPost && (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-primary mb-3">Featured</h2>
                <PostCard post={featuredPost} />
              </section>
            )}
            <section>
              <h2 className="text-xl font-bold mb-4">Latest Posts</h2>
              <PostList posts={recentPosts} />
            </section>
          </div>
          <Sidebar categories={categories} />
        </div>
      </main>
      <Footer />
    </>
  )
}
```

### `app/blog/[slug]/page.tsx` (post detail — page body)

```typescript
// imports: Header, Footer, Sidebar, PostBody, AuthorCard, RelatedPosts, TagList, Breadcrumb, Image
return (
  <>
    <PostJsonLd post={post} />
    <BreadcrumbJsonLd items={[...]} />
    <Header />
    <main className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
        <article>
          <Breadcrumb items={[
            { name: 'Home', href: '/' },
            { name: 'Blog', href: '/blog' },
            { name: post.title },
          ]} />
          <h1 className="text-3xl font-bold mt-4 mb-2">{post.title}</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {post.publishedAt.toLocaleDateString()} · {post.author.name}
          </p>
          {post.featuredImage && (
            <Image src={post.featuredImage.url} alt={post.featuredImage.alt}
              width={post.featuredImage.width} height={post.featuredImage.height}
              className="w-full rounded-lg mb-6" priority />
          )}
          <PostBody content={post.content} />
          <TagList tags={post.tags} />
          <AuthorCard author={post.author} />
          <RelatedPosts posts={relatedPosts} />
        </article>
        <Sidebar categories={[]} />
      </div>
    </main>
    <Footer />
  </>
)
```

Follow the same `<Header> + container + Sidebar + <Footer>` shell for `/blog`, `/category/[slug]`, `/tag/[slug]`, and `/page/[slug]`.

---

## Step 7 — Comment Components

### `src/components/post/CommentItem.tsx` (Server Component)

```typescript
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ContentHtml } from './ContentHtml'
import type { Comment } from '@/domain/comment/comment.model'

type Props = { comment: Comment; depth?: number }

export const CommentItem = ({ comment, depth = 0 }: Props) => (
  <div className={`${depth > 0 ? 'ml-8 border-l pl-4' : ''} mt-4`}>
    <div className="flex items-start gap-3">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="text-xs">
          {comment.authorName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-sm">{comment.authorName}</span>
          <span className="text-xs text-muted-foreground">
            {comment.publishedAt.toLocaleDateString('en-US', {
              year: 'numeric', month: 'short', day: 'numeric',
            })}
          </span>
        </div>
        <ContentHtml html={comment.content} className="text-sm prose prose-sm max-w-none" />
      </div>
    </div>
    {comment.children.map((child) => (
      <CommentItem key={child.id} comment={child} depth={depth + 1} />
    ))}
  </div>
)
```

`depth` drives visual nesting — `ml-8 border-l pl-4` indents replies one level. The component recurses for arbitrarily deep threads.

### `src/components/post/CommentList.tsx` (Server Component)

```typescript
import { Separator } from '@/components/ui/separator'
import { CommentItem } from './CommentItem'
import type { Comment } from '@/domain/comment/comment.model'

type Props = { comments: Comment[] }

export const CommentList = ({ comments }: Props) => {
  if (comments.length === 0) return null

  return (
    <section className="mt-12">
      <h2 className="text-xl font-bold mb-4">
        {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
      </h2>
      <Separator className="mb-6" />
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </section>
  )
}
```

`comments` here is the root-level list from `buildCommentTree` — each item already has nested `children`.

### `src/components/post/CommentForm.tsx` (`'use client'`)

```typescript
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
      <h2 className="text-xl font-bold mb-4">Leave a Comment</h2>
      {status === 'success' ? (
        <p className="text-sm text-muted-foreground border rounded-lg p-4">
          Your comment has been submitted and is awaiting moderation. Thank you!
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              name="authorName"
              required
              placeholder="Name *"
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
            <input
              name="authorEmail"
              type="email"
              required
              placeholder="Email * (not displayed)"
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>
          <textarea
            name="content"
            required
            rows={5}
            placeholder="Your comment..."
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
          />
          {status === 'error' && (
            <p className="text-destructive text-sm">{errorMessage}</p>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Submitting…' : 'Post Comment'}
          </Button>
        </form>
      )}
    </section>
  )
}
```

**Key design decisions:**

- `useTransition` wraps the Server Action call — keeps the UI responsive during submission; `isPending` drives the button state
- `form.reset()` only fires on success — preserves form data on error so the user can fix and retry
- Always shows "awaiting moderation" on success — WP holds new authors for review; setting this expectation prevents confusion
- `authorEmail` is never displayed in the UI — only sent to WP for moderation and spam purposes

### Update `app/blog/[slug]/page.tsx` — add `CommentList` and `CommentForm`

Add to the article imports and body:

```typescript
import { CommentList } from '@/components/post/CommentList'
import { CommentForm } from '@/components/post/CommentForm'

// Destructure comments from result:
const { post, relatedPosts, comments } = result

// In the article element, after <RelatedPosts>:
<CommentList comments={comments} />
<CommentForm postId={post.id} />
```

---

## Verification Checklist

1. `npm run build` — zero errors
2. `npm start` — golden path:
   - Homepage renders featured post + grid of recent posts + sidebar
   - Click a post → renders title, featured image, body with in-content ad, tags, author, related posts
   - Post page shows `CommentList` (if post has comments) and `CommentForm`
   - Category/tag archive renders filtered post grid + pagination
3. Browser devtools — `<ins class="adsbygoogle">` renders in content, sidebar, header, footer
4. `var(--brand-primary)` resolves to the team's color (check devtools → computed styles)
5. Lighthouse — no CLS from images (explicit width/height on all `<Image>` calls)
6. Submit a comment → WP dashboard shows it as "Pending"; UI shows "awaiting moderation" message
7. Approve comment in WP → within 5 min (ISR revalidation) → comment appears on post page
8. `npm run typecheck` + `npm run lint` — zero errors

---

## Definition of Done

- Ad abstraction layer working end-to-end: `AdProvider` → `AdSlot` → `AdSenseProvider`
- Switching `NEXT_PUBLIC_AD_PROVIDER=prebid` renders `PrebidSlot` stub without component changes
- All post, layout, navigation components built and composing correctly
- Route placeholders from Phase 5 replaced with real layouts
- `app/providers.tsx` wraps `AdProvider`; `layout.tsx` uses `<Providers>`
- `not-prose` applied to ad slot in `PostBody` to prevent typography style bleed
- `CommentList` renders nested comments (replies indented under parents)
- `CommentForm` shows "awaiting moderation" on success and WP error message on failure
- Submit a comment on a test post → WP dashboard shows it as "Pending"
- Approve it in WP → page revalidates within 5 min → comment appears

---

## Key Gotchas

| Area                          | Issue                                                              | Fix                                                                          |
| ----------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| `adsbygoogle.push`            | Crashes on SSR                                                     | 'use client' + useEffect only in AdSenseProvider                             |
| `AdSlot` in Server Components | `AdSlot` is a Client Component                                     | Fine — Server Components can import/render Client Components                 |
| `ContentHtml`                 | `dangerouslySetInnerHTML` needs 'use client'                       | `ContentHtml.tsx` is Client Component; `PostBody.tsx` stays Server           |
| `not-prose`                   | AdSlot inside `.prose` gets unwanted typography styles             | Add `not-prose` class to `AdSlot` wrapper in PostBody                        |
| `ins` element                 | React warns about unknown HTML attributes                          | Use `data-*` attrs; pass `style` as JS object                                |
| Badge asChild                 | Wraps `<Link>` — Radix passes href through correctly               | Use `asChild` + `<Link>` for category/tag badges                             |
| Sidebar on post pages         | Post page doesn't have category list                               | Pass empty array or pre-fetch categories separately in route                 |
| Page count overflow           | 100+ pages renders too many pagination links                       | Add ellipsis logic in later iteration                                        |
| `CommentForm` is 'use client' | Server Action still runs server-side                               | `'use server'` in `submitComment.ts` overrides the client boundary           |
| `CommentItem` recursion       | Each level renders children synchronously                          | Fine for comments — depth rarely exceeds 2-3 levels                          |
| Comments count                | `CommentList` receives root-level comments — count should be total | Count flat before tree-building if total matters; for now root count is fine |

---

## Ad Provider Migration Path

1. **Now (AdSense):** `NEXT_PUBLIC_AD_PROVIDER=adsense` — simple setup, no GAM needed
2. **Header bidding:** Create GAM account + SSP seats, implement `PrebidProvider`, set `NEXT_PUBLIC_AD_PROVIDER=prebid`
3. **`AdSlot` interface never changes** — placements are stable; only the provider implementation swaps
