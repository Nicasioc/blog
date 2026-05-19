import { siteConfig } from '@/lib/siteConfig'

export default function HomePage() {
  return (
    <main className="container mx-auto p-8">
      <h1 className="text-4xl font-bold text-brand-primary">{siteConfig.siteName}</h1>
      <p className="mt-2 text-muted-foreground">Phase 1 complete — scaffold is ready.</p>
    </main>
  )
}
